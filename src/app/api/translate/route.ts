import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang = 'bn' } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ translation: '', success: true });
    }

    // Clean stealth bypass symbols for natural translation if any exist
    const cleanForTranslation = text
      .replace(/p[-_]ay/gi, 'pay')
      .replace(/c[-_]ontact/gi, 'contact')
      .replace(/e[-_]mail/gi, 'email')
      .replace(/w[-_]hatsapp/gi, 'whatsapp')
      .replace(/s[-_]kype/gi, 'skype')
      .replace(/z[-_]oom/gi, 'zoom')
      .replace(/a[-_]ccount/gi, 'account')
      .replace(/b[-_]ank/gi, 'bank')
      .replace(/r[-_]ating/gi, 'rating')
      .replace(/r[-_]eview/gi, 'review')
      .replace(/\u200B/g, ''); // Remove zero-width spaces

    // 1. Primary: Try Google Translate GTX Endpoint
    try {
      const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanForTranslation)}`;
      const response = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedText = data[0]
            .map((segment: any) => (Array.isArray(segment) ? segment[0] : ''))
            .filter(Boolean)
            .join('');

          if (translatedText && translatedText.trim()) {
            return NextResponse.json({
              translation: translatedText,
              provider: 'google',
              success: true
            });
          }
        }
      }
    } catch (gErr) {
      console.warn('Google GTX endpoint failed, trying MyMemory fallback:', gErr);
    }

    // 2. Secondary Fallback: MyMemory API
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanForTranslation)}&langpair=en|${targetLang}`;
      const response = await fetch(myMemoryUrl);
      if (response.ok) {
        const data = await response.json();
        if (data && data.responseData && data.responseData.translatedText) {
          return NextResponse.json({
            translation: data.responseData.translatedText,
            provider: 'mymemory',
            success: true
          });
        }
      }
    } catch (mmErr) {
      console.warn('MyMemory endpoint failed:', mmErr);
    }

    return NextResponse.json({
      translation: text,
      provider: 'fallback',
      success: false
    });
  } catch (error: any) {
    console.error('Translation route error:', error);
    return NextResponse.json(
      { translation: '', error: error.message },
      { status: 500 }
    );
  }
}
