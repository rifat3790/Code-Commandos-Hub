import { google } from '@ai-sdk/google';
import { streamText, tool, toUIMessageStream, createUIMessageStreamResponse, isStepCount } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Circuit Breaker state to bypass Gemini if it is rate-limited
let isGeminiAvailable = true;
let lastGeminiErrorTime = 0;
const BREAKER_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown

// Elegant Fallback Response when all services fail
async function getErrorFallbackResponse(errorMessage: string) {
  const uiStream = new ReadableStream({
    start(controller) {
      const messageId = Math.random().toString(36).substring(7);
      controller.enqueue({ type: 'start', messageId });
      controller.enqueue({ type: 'text-start', id: messageId });
      
      const fallbackText = `দুঃখিত, সিস্টেমে সাময়িক সংযোগ সমস্যা হচ্ছে। অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন চেক করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।\n\n*(ত্রুটি: ${errorMessage})*`;
      controller.enqueue({ type: 'text-delta', id: messageId, delta: fallbackText });
      
      controller.enqueue({ type: 'text-end', id: messageId });
      controller.enqueue({ type: 'finish' });
      controller.close();
    }
  });

  return createUIMessageStreamResponse({
    stream: uiStream,
  });
}

export async function POST(req: Request) {
  let messages: any[] = [];
  let selectedModel = 'gemini-2.0-flash-lite';
  try {
    const jsonBody = await req.json();
    console.log("[DEBUG] Incoming Request Body:", JSON.stringify(jsonBody, null, 2));
    messages = jsonBody.messages || [];
    selectedModel = jsonBody.selectedModel || 'gemini-2.0-flash-lite';

    // Limit history to the last 10 messages to save tokens and avoid Google API rate limits
    const recentMessages = messages.slice(-10);

    // Determine if the selected model is Google Gemini or a Pollinations hosted model
    const isGoogleModel = selectedModel.startsWith('gemini-');

    // If Gemini was recently rate-limited, skip it and use Pollinations AI fallback directly
    const timeSinceLastError = Date.now() - lastGeminiErrorTime;
    const isBreakerActive = !isGeminiAvailable && timeSinceLastError < BREAKER_COOLDOWN_MS;
    
    if (isBreakerActive && isGoogleModel) {
      console.log(`[Circuit Breaker] Gemini is cooling down. Routing directly to Pollinations AI.`);
    }

    // If breaker is active, or if it is a non-Google model, route directly to Pollinations
    if ((isBreakerActive && isGoogleModel) || !isGoogleModel) {
      return handlePollinationsFallback(recentMessages, isGoogleModel ? 'openai' : selectedModel);
    }

    // Map UI messages to Google SDK compatible CoreMessage format
    const googleMessages = recentMessages.map((m: any) => {
      const role: 'user' | 'assistant' = m.role === 'user' ? 'user' : 'assistant';
      
      let textContent = m.content || '';
      const parts = m.parts || [];
      const experimental_attachments = m.experimental_attachments || [];
      const attachments = [...parts, ...experimental_attachments];

      if (!textContent && parts.length > 0) {
        const textPart = parts.find((p: any) => p.type === 'text');
        if (textPart) {
          textContent = textPart.text || '';
        }
      }

      if (attachments && attachments.length > 0) {
        const contentParts: any[] = [];
        if (textContent) {
           contentParts.push({ type: 'text', text: textContent });
        }
        for (const part of attachments) {
          if (part.type === 'text') continue;
          const mimeType = part.contentType || part.mediaType || 'image/png';
          if (mimeType.startsWith('image/') || part.type === 'image' || part.type === 'file') {
            try {
              const url = part.url || part.data;
              if (!url) continue;
              const dataUrlRegex = /^data:(image\/[a-zA-Z+-]+);base64,(.*)$/;
              const match = url.match(dataUrlRegex);
              if (match) {
                contentParts.push({
                  type: 'image',
                  image: Buffer.from(match[2], 'base64'),
                  mimeType: match[1]
                });
              } else {
                contentParts.push({
                  type: 'image',
                  image: new URL(url)
                });
              }
            } catch (e) {
              console.error("Failed parsing inline image:", e);
            }
          }
        }
        
        if (contentParts.length === 0) {
           return { role, content: textContent };
        }
        
        return {
          role,
          content: contentParts
        };
      }
      return {
        role,
        content: textContent
      };
    });

    if (!selectedModel.startsWith('gemini')) {
      throw new Error(`Routing non-Google model (${selectedModel}) to Pollinations Network`);
    }
    
    const modelName = selectedModel === 'gemini-2.0-flash' ? 'gemini-2.0-flash' : 'gemini-2.0-flash-lite';

    const result = streamText({
      model: google(modelName),
      system: `You are 'Code Commandos Assistant', a highly professional, premium AI Assistant.
If the user asks to draw, generate, or create an image, banner, art, photo, sketch, or illustration, ALWAYS use the 'generateImage' tool to generate the image. You must parse their request for any mention of size, resolution, or aspect ratio (e.g. 16:9, landscape, portrait, 500x300, etc.) and pass those values to the tool.
You can read text inside uploaded images, analyze their contents in detail, and answer user queries about them.
CRITICAL: ALWAYS reply in highly professional, polished English. NEVER use Bengali or other languages, even if the user speaks in another language. Ensure your tone is helpful, concise, and extremely professional.`,
      messages: googleMessages,
      stopWhen: isStepCount(5),
      tools: {
        generateImage: tool({
          description: 'Generate an image based on a prompt and optional size parameters',
          parameters: z.object({
            prompt: z.string().describe('The prompt for the image generation'),
            width: z.number().optional().describe('Optional width of the image (default: 1024)'),
            height: z.number().optional().describe('Optional height of the image (default: 1024)'),
          }),
          // @ts-ignore
          execute: async ({ prompt, width, height }: { prompt: string; width?: number; height?: number }) => {
            const seed = Math.floor(Math.random() * 100000000);
            const w = width || 1024;
            const h = height || 1024;
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=1&seed=${seed}`;
            
            return {
              url: url,
              prompt: prompt,
            };
          },
        }),
      },
    });

    const uiStream = toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
    });

    // Verify if Gemini is responding or throws an error (e.g. 429/403) by pre-reading the first chunk of uiStream
    const reader = uiStream.getReader();
    let firstResult: any;
    try {
      firstResult = await reader.read();
      if (firstResult && firstResult.value && firstResult.value.type === 'error') {
        throw new Error(firstResult.value.errorText || 'Gemini stream error chunk');
      }
    } catch (e) {
      reader.releaseLock();
      throw e; // Hand over to catch block for Pollinations fallback
    }

    // Reconstruct stream for Vercel UI Message Stream response
    const reconstructedStream = new ReadableStream({
      async start(controller) {
        if (firstResult) {
          if (firstResult.value) {
            controller.enqueue(firstResult.value);
          }
          if (firstResult.done) {
            controller.close();
            reader.releaseLock();
            return;
          }
        }
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            if (value && value.type === 'error') {
              // Trip circuit breaker on mid-stream error
              isGeminiAvailable = false;
              lastGeminiErrorTime = Date.now();
              console.warn("[Circuit Breaker] Mid-stream Gemini error detected. Tripping circuit breaker.");
            }
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      }
    });

    return createUIMessageStreamResponse({
      stream: reconstructedStream,
    });
  } catch (error: any) {
    console.warn("Gemini API error or rate limit hit. Tripping circuit breaker and falling back to Pollinations AI:", error);
    
    // Trip the circuit breaker on initial handshake failure
    isGeminiAvailable = false;
    lastGeminiErrorTime = Date.now();

    try {
      return await handlePollinationsFallback(messages.slice(-10), selectedModel);
    } catch (fallbackError: any) {
      console.error("Pollinations fallback also failed:", fallbackError);
      return getErrorFallbackResponse(fallbackError.message || String(fallbackError));
    }
  }
}

// Helper function to handle keyless fallback stream to Pollinations AI
async function handlePollinationsFallback(recentMessages: any[], pollinationsModel: string) {
  // All premium UI models default to 'openai' (GPT-4o) in the Pollinations legacy API to guarantee stability and prevent 404s
  const modelCode = 'openai'; 

  // Map messages (including uploaded images) for OpenAI/Pollinations API
  const pollinationsMessages = recentMessages.map((m: any) => {
    let textContent = m.content || '';
    const parts = m.parts || [];
    const experimental_attachments = m.experimental_attachments || [];
    const attachments = [...parts, ...experimental_attachments];

    if (!textContent && parts.length > 0) {
      const textPart = parts.find((p: any) => p.type === 'text');
      if (textPart) {
        textContent = textPart.text || '';
      }
    }

    let finalContent = textContent;
    if (attachments && attachments.length > 0) {
      for (const part of attachments) {
        if (part.type === 'text') continue;
        const mimeType = part.contentType || part.mediaType || '';
        if (mimeType.startsWith('image/') || part.type === 'image' || part.type === 'file') {
          const url = part.url || part.data;
          if (url && !url.startsWith('data:')) {
            finalContent += `\n[Image Attached: ${url}]`;
          }
        }
      }
    }
    
    return {
      role: m.role === 'user' ? 'user' : 'assistant',
      content: finalContent
    };
  });

  const pollinationsRes = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: pollinationsMessages,
      model: modelCode,
      stream: true,
      system: `You are a premium AI Assistant with image analysis capabilities. Always be helpful, friendly, and reply in the same language as the user (English or Bengali).
You can see uploaded images and read text from them, analyze their contents, and translate them to Bengali or any other language if asked.
If the user asks you to generate, draw, or create an image/banner/illustration, do not say you cannot do it. Instead, generate a markdown image link exactly in this format:
![prompt](https://image.pollinations.ai/prompt/PROMPT_HERE?width=W&height=H&nologo=true&seed=RANDOM_NUMBER)
where:
- PROMPT_HERE is a descriptive English prompt.
- RANDOM_NUMBER is a random number.
- W and H are the requested width and height in pixels.
- YOU MUST parse the user's request for sizes. If they ask for 16:9, landscape, or banner, set width=1920 and height=1080. If they ask for portrait or mobile, set width=1080 and height=1920. If they specify dimensions (e.g. 500x300), use those dimensions (e.g., width=500 and height=300). Default to width=1024 and height=1024 if no size is specified.`
    })
  });

  if (!pollinationsRes.ok) {
    throw new Error(`Fallback API failed: ${pollinationsRes.statusText}`);
  }

  const reader = pollinationsRes.body?.getReader();
  const decoder = new TextDecoder();

  const uiStream = new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }

      const messageId = Math.random().toString(36).substring(7);
      controller.enqueue({ type: 'start', messageId });
      controller.enqueue({ type: 'text-start', id: messageId });

      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmed.slice(6));
                const text = data.choices?.[0]?.delta?.content || '';
                if (text) {
                  controller.enqueue({ type: 'text-delta', id: messageId, delta: text });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        console.error("Stream reading error in fallback:", err);
      } finally {
        controller.enqueue({ type: 'text-end', id: messageId });
        controller.enqueue({ type: 'finish' });
        controller.close();
      }
    }
  });

  return createUIMessageStreamResponse({
    stream: uiStream,
  });
}
