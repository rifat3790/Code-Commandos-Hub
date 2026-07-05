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

    // Create Shopify directory structure
    zip.folder("assets");
    zip.folder("config");
    zip.folder("layout");
    zip.folder("locales");
    zip.folder("sections");
    zip.folder("snippets");
    zip.folder("templates");

    // Populate static Shopify configurations
    zip.file("config/settings_schema.json", JSON.stringify([
      {
        "name": "theme_info",
        "theme_name": "Scraped Theme Clone",
        "theme_version": "1.0.0",
        "theme_author": "Code Commandos",
        "theme_documentation_url": "https://github.com",
        "theme_support_url": "https://github.com"
      }
    ], null, 2));

    zip.file("config/settings_data.json", JSON.stringify({
      "current": "Default",
      "presets": {
        "Default": {
          "sections": {}
        }
      }
    }, null, 2));

    zip.file("locales/en.default.json", JSON.stringify({
      "general": {
        "password_page": {
          "login_form_heading": "Enter store using password"
        }
      }
    }, null, 2));

    // Placeholders to preserve empty folders in ZIP
    zip.file("sections/placeholder.liquid", "{% comment %}Placeholder section{% endcomment %}");
    zip.file("snippets/placeholder.liquid", "{% comment %}Placeholder snippet{% endcomment %}");

    // Regex to extract asset paths
    const cssRegex = /<link [^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["']/gi;
    const jsRegex = /<script [^>]*src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi;
    const imgRegex = /<img [^>]*src=["']([^"']+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?[^"']*)?)["']/gi;

    const assetsToDownload: { url: string; type: 'css' | 'js' | 'img' }[] = [];
    let match;

    // CSS
    while ((match = cssRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, type: 'css' });
      }
    }

    // JS
    while ((match = jsRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, type: 'js' });
      }
    }

    // Images
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        assetsToDownload.push({ url, type: 'img' });
      }
    }

    const uniqueAssets = Array.from(new Set(assetsToDownload.map(a => JSON.stringify(a)))).map(s => JSON.parse(s)) as typeof assetsToDownload;

    // We'll perform rewrites on both <head> and <body> content separately
    let headContent = '';
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      headContent = headMatch[1];
    }

    let bodyContent = '';
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyContent = bodyMatch[1];
    } else {
      bodyContent = html;
    }

    // Limit download batch to 60 to prevent long await or timeout
    const limitedAssets = uniqueAssets.slice(0, 60);

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
          // Extract filename without queries
          const parsedUrl = new URL(assetUrl);
          let filename = parsedUrl.pathname.split('/').pop() || 'asset';
          filename = filename.split('?')[0];

          if (!filename.includes('.')) {
            if (asset.type === 'css') filename += '.css';
            else if (asset.type === 'js') filename += '.js';
            else filename += '.png';
          }

          // In Shopify themes, assets must be placed FLAT under the assets directory!
          zip.file(`assets/${filename}`, buffer);

          // Map/Replace asset reference in both head and body using Shopify liquid syntax
          const liquidAssetRef = `{{ '${filename}' | asset_url }}`;
          headContent = headContent.replaceAll(asset.url, liquidAssetRef);
          bodyContent = bodyContent.replaceAll(asset.url, liquidAssetRef);
        }
      } catch (err) {
        console.warn(`Export failure for asset: ${assetUrl}`, err);
      }
    });

    await Promise.all(downloadPromises);

    // Build standard layout/theme.liquid
    // We must inject {{ content_for_header }} in the head, and {{ content_for_layout }} in the body
    const themeLiquid = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{{ page_title }}</title>
    
    <!-- Scraped head resources -->
    ${headContent}
    
    {{ content_for_header }}
  </head>
  <body>
    {{ content_for_layout }}
  </body>
</html>`;

    // Build templates/index.liquid (holds homepage layout)
    const indexLiquid = `{% comment %}
  Homepage reconstructed from scraped storefront HTML
{% endcomment %}

${bodyContent}`;

    zip.file("layout/theme.liquid", themeLiquid);
    zip.file("templates/index.liquid", indexLiquid);

    // Generate standard zip output
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');

    return new Response(zipBlob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="theme_export_${cleanDomain}.zip"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
