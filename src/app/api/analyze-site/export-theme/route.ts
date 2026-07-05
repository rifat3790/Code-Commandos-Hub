import { NextResponse } from 'next/server';
import JSZip from 'jszip';

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
        console.warn('Export Theme Auth Failed', err);
      }
    }

    // Fetch homepage
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

    const zip = new JSZip();

    // Regex to extract asset paths
    const cssRegex = /<link [^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["']/gi;
    const jsRegex = /<script [^>]*src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi;
    const imgRegex = /<img [^>]*src=["']([^"']+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^"']*)?)["']/gi;

    const assetsToDownload: { url: string; folder: string }[] = [];
    let match;

    // CSS stylesheets
    while ((match = cssRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, folder: 'assets/css' });
      }
    }

    // JS scripts
    while ((match = jsRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, folder: 'assets/js' });
      }
    }

    // Images
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, folder: 'assets/images' });
      }
    }

    // Filter duplicates
    const uniqueAssets = Array.from(new Set(assetsToDownload.map(a => JSON.stringify(a)))).map(s => JSON.parse(s)) as typeof assetsToDownload;

    // We will rewrite matched URLs inside index.html to refer to local ZIP paths
    let rewrittenHtml = html;

    // Limit to 50 assets to avoid high latency or server timeouts
    const limitedAssets = uniqueAssets.slice(0, 50);

    // Parallel downloader
    const downloadPromises = limitedAssets.map(async (asset) => {
      let assetUrl = asset.url;
      if (assetUrl.startsWith('//')) {
        assetUrl = 'https:' + assetUrl;
      } else if (assetUrl.startsWith('/')) {
        assetUrl = origin + assetUrl;
      } else if (!/^https?:\/\//i.test(assetUrl)) {
        assetUrl = origin + '/' + assetUrl;
      }

      try {
        const res = await fetch(assetUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          // Cleanup file name
          const parsedUrl = new URL(assetUrl);
          let filename = parsedUrl.pathname.split('/').pop() || 'asset';
          filename = filename.split('?')[0]; // strip query strings
          
          if (!filename.includes('.')) {
            if (asset.folder === 'assets/css') filename += '.css';
            else if (asset.folder === 'assets/js') filename += '.js';
            else filename += '.png';
          }

          const zipPath = `${asset.folder}/${filename}`;
          zip.file(zipPath, buffer);

          // Update HTML mapping
          const localPath = `./${zipPath}`;
          rewrittenHtml = rewrittenHtml.replaceAll(asset.url, localPath);
        }
      } catch (err) {
        console.warn(`Export failure for asset: ${assetUrl}`, err);
      }
    });

    await Promise.all(downloadPromises);

    // Add main html page
    zip.file("index.html", rewrittenHtml);

    // Generate standard zip output
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${cleanDomain}_theme_assets.zip"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
