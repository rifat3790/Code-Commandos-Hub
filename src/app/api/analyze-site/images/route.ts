import { NextResponse } from 'next/server';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const storePassword = searchParams.get('storePassword');

    if (!rawUrl) {
      return NextResponse.json({ success: false, error: 'URL parameter is required.' }, { status: 400 });
    }

    // Normalize URL
    let normalized = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(normalized);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid URL format.' }, { status: 400 });
    }

    const domain = urlObj.hostname;
    const origin = urlObj.origin;
    let fetchHeaders: Record<string, string> = { 'User-Agent': USER_AGENT };

    // Password Bypass Auth Flow
    if (storePassword) {
      const authBody = new URLSearchParams();
      authBody.append('form_type', 'storefront_password');
      authBody.append('password', storePassword);

      try {
        const authRes = await fetch(`${origin}/password`, {
          method: 'POST',
          headers: { 
            'User-Agent': USER_AGENT, 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: authBody.toString(),
          redirect: 'manual'
        });
        
        const cookies = authRes.headers.getSetCookie ? authRes.headers.getSetCookie() : [];
        if (cookies.length > 0) {
          fetchHeaders['Cookie'] = cookies.map(c => c.split(';')[0]).join('; ');
        } else {
          const rawCookies = authRes.headers.get('set-cookie');
          if (rawCookies) fetchHeaders['Cookie'] = rawCookies;
        }
      } catch (err) {
        console.warn('Image fetch auth failed', err);
      }
    }

    // Fetch homepage HTML
    let html = '';
    try {
      const homeRes = await fetch(origin, {
        headers: fetchHeaders,
        next: { revalidate: 0 }
      });
      if (!homeRes.ok) {
        return NextResponse.json({ success: false, error: `Failed to fetch homepage: ${homeRes.statusText}` }, { status: 500 });
      }
      html = await homeRes.text();
    } catch (err: any) {
      return NextResponse.json({ success: false, error: `Connection failed: ${err.message}` }, { status: 500 });
    }

    const imageSet = new Set<string>();

    // 1. Scrape standard img src
    const imgRegex = /<img [^>]*src=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      imageSet.add(match[1]);
    }

    // 2. Scrape source/img srcset
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcset = match[1];
      // srcset holds multiple items separated by comma, e.g. "url 480w, url2 800w"
      const parts = srcset.split(',');
      parts.forEach(p => {
        const cleanPart = p.trim().split(/\s+/)[0];
        if (cleanPart) imageSet.add(cleanPart);
      });
    }

    // 3. Scrape inline style background images
    const bgRegex = /url\(['"]?([^'")]+)['"]?\)/gi;
    while ((match = bgRegex.exec(html)) !== null) {
      imageSet.add(match[1]);
    }

    // Resolve relative URLs and filter out tracking elements/base64
    const resolvedImages: string[] = [];

    imageSet.forEach(img => {
      let resolved = img.trim();

      // Skip base64, tracking pixels, SVGs that are just icons
      if (resolved.startsWith('data:') || 
          resolved.includes('/tr?') || 
          resolved.includes('facebook.com/tr') || 
          resolved.includes('google-analytics') ||
          resolved.endsWith('.ico') ||
          (resolved.includes('1x1') && resolved.includes('gif'))
      ) {
        return;
      }

      if (resolved.startsWith('//')) {
        resolved = 'https:' + resolved;
      } else if (resolved.startsWith('/')) {
        resolved = origin + resolved;
      } else if (!/^https?:\/\//i.test(resolved)) {
        resolved = origin + '/' + resolved;
      }

      resolvedImages.push(resolved);
    });

    // Remove duplicates from final resolved URLs
    const finalImages = Array.from(new Set(resolvedImages));

    // Scrape video elements
    const videoSet = new Set<string>();

    // 1. Scrape <video src="..."> tags
    const videoSrcRegex = /<video [^>]*src=["']([^"']+)["']/gi;
    let videoMatch;
    while ((videoMatch = videoSrcRegex.exec(html)) !== null) {
      videoSet.add(videoMatch[1]);
    }

    // 2. Scrape <source src="..."> tags inside video tags
    const sourceSrcRegex = /<source [^>]*src=["']([^"']+)["']/gi;
    while ((videoMatch = sourceSrcRegex.exec(html)) !== null) {
      videoSet.add(videoMatch[1]);
    }

    // 3. Scrape iframe embed video sources (YouTube & Vimeo)
    const iframeSrcRegex = /<iframe [^>]*src=["']([^"']+)["']/gi;
    while ((videoMatch = iframeSrcRegex.exec(html)) !== null) {
      const src = videoMatch[1];
      if (src.includes('youtube.com/') || src.includes('youtu.be/') || src.includes('vimeo.com/')) {
        videoSet.add(src);
      }
    }

    // 4. Look for direct video links (.mp4, .webm, .ogg, .mov)
    const directVideoRegex = /["']([^"']+\.(?:mp4|webm|ogg|mov)(?:\?[^"']*)?)["']/gi;
    while ((videoMatch = directVideoRegex.exec(html)) !== null) {
      videoSet.add(videoMatch[1]);
    }

    const resolvedVideos: string[] = [];
    videoSet.forEach(vid => {
      let resolved = vid.trim();
      if (resolved.startsWith('//')) {
        resolved = 'https:' + resolved;
      } else if (resolved.startsWith('/')) {
        resolved = origin + resolved;
      } else if (!/^https?:\/\//i.test(resolved)) {
        if (resolved.startsWith('.') || resolved.includes('/') || resolved.endsWith('.mp4') || resolved.endsWith('.webm')) {
          resolved = origin + '/' + resolved.replace(/^\.\//, '');
        } else {
          return;
        }
      }
      resolvedVideos.push(resolved);
    });

    const finalVideos = Array.from(new Set(resolvedVideos));

    return NextResponse.json({
      success: true,
      images: finalImages,
      videos: finalVideos
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
