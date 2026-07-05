import { NextResponse } from 'next/server';
import JSZip from 'jszip';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchAssetWithRetry(key: string, themeId: number, domain: string, token: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`https://${domain}/admin/api/2023-07/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'User-Agent': USER_AGENT
        }
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        // Wait 1.5 seconds on 429 rate limit
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }
      throw new Error(`Status ${res.status}`);
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');
    const storePassword = searchParams.get('storePassword');
    const adminToken = searchParams.get('adminToken');

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

    const zip = new JSZip();

    // -------------------------------------------------------------------------
    // FLOW A: Shopify Admin API Exporter (100% Original files)
    // -------------------------------------------------------------------------
    if (adminToken) {
      // 1. Fetch themes list to find active theme ID
      let themesRes;
      try {
        themesRes = await fetch(`https://${domain}/admin/api/2023-07/themes.json`, {
          headers: {
            'X-Shopify-Access-Token': adminToken,
            'User-Agent': USER_AGENT
          }
        });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `Failed to connect to Admin API: ${err.message}` }, { status: 500 });
      }

      if (!themesRes.ok) {
        return NextResponse.json({ success: false, error: `Admin API authentication failed (HTTP ${themesRes.status}). Verify your token.` }, { status: themesRes.status });
      }

      const themesData = await themesRes.json();
      const activeTheme = themesData.themes?.find((t: any) => t.role === 'main');
      if (!activeTheme) {
        return NextResponse.json({ success: false, error: 'Could not detect an active theme on this store. Ensure the API token has theme access.' }, { status: 404 });
      }

      const themeId = activeTheme.id;

      // 2. Fetch full list of theme assets
      const assetsRes = await fetch(`https://${domain}/admin/api/2023-07/themes/${themeId}/assets.json`, {
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'User-Agent': USER_AGENT
        }
      });
      if (!assetsRes.ok) {
        return NextResponse.json({ success: false, error: `Failed to fetch theme assets map (HTTP ${assetsRes.status})` }, { status: assetsRes.status });
      }

      const assetsData = await assetsRes.json();
      const assetsList = assetsData.assets || [];

      // 3. Batch download assets to stay within Shopify API rate limit limits
      const batchSize = 15;
      for (let i = 0; i < assetsList.length; i += batchSize) {
        const batch = assetsList.slice(i, i + batchSize);
        await Promise.all(batch.map(async (asset: any) => {
          try {
            const data = await fetchAssetWithRetry(asset.key, themeId, domain, adminToken);
            const content = data.asset;
            if (content) {
              if (content.value) {
                zip.file(asset.key, content.value);
              } else if (content.attachment) {
                zip.file(asset.key, Buffer.from(content.attachment, 'base64'));
              }
            }
          } catch (err) {
            console.warn(`Admin API asset download failed for key: ${asset.key}`, err);
          }
        }));
        // Cool-down period between batches to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 150));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const cleanDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');

      return new Response(zipBlob, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="original_theme_${cleanDomain}.zip"`
        }
      });
    }

    // -------------------------------------------------------------------------
    // FLOW B: Public Storefront Scraper Exporter (Closest Static Clone)
    // -------------------------------------------------------------------------
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

    // Placeholders to preserve empty folders/snippets in ZIP
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

    // Modern Shopify OS 2.0 Templates Scaffolding (JSON Templates pointing to sections)
    zip.file("templates/index.json", JSON.stringify({
      "sections": {
        "main": {
          "type": "main-index",
          "settings": {}
        }
      },
      "order": ["main"]
    }, null, 2));

    zip.file("templates/product.json", JSON.stringify({
      "sections": {
        "main": {
          "type": "main-product",
          "settings": {}
        }
      },
      "order": ["main"]
    }, null, 2));

    zip.file("templates/collection.json", JSON.stringify({
      "sections": {
        "main": {
          "type": "main-collection",
          "settings": {}
        }
      },
      "order": ["main"]
    }, null, 2));

    zip.file("templates/404.json", JSON.stringify({
      "sections": {
        "main": {
          "type": "main-404",
          "settings": {}
        }
      },
      "order": ["main"]
    }, null, 2));

    zip.file("templates/cart.json", JSON.stringify({
      "sections": {
        "main": {
          "type": "main-cart",
          "settings": {}
        }
      },
      "order": ["main"]
    }, null, 2));

    // Compile section codes holding the scraped pages
    const mainIndexLiquid = `{% comment %}
  Homepage reconstructed from scraped storefront HTML
{% endcomment %}

<div class="scraped-homepage-section">
  ${bodyContent}
</div>

{% schema %}
{
  "name": "Scraped Homepage Content",
  "settings": [],
  "presets": [
    {
      "name": "Default"
    }
  ]
}
{% endschema %}`;

    const mainProductLiquid = `<div class="product-page-placeholder" style="padding: 80px 20px; text-align: center; max-width: 1200px; margin: 0 auto;">
  <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">{{ product.title }}</h1>
  <div style="font-size: 1.5rem; color: #666; margin-bottom: 2rem;">{{ product.price | money }}</div>
  <button style="padding: 12px 30px; font-weight: bold; background: #000; color: #fff; border: none; cursor: pointer;">Add to Cart</button>
</div>
{% schema %}
{
  "name": "Product Details Placeholder",
  "settings": []
}
{% endschema %}`;

    const mainCollectionLiquid = `<div class="collection-page-placeholder" style="padding: 80px 20px; text-align: center; max-width: 1200px; margin: 0 auto;">
  <h1 style="font-size: 2.5rem; margin-bottom: 2rem;">Collection: {{ collection.title }}</h1>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
    {% for product in collection.products %}
      <div style="border: 1px solid #eee; padding: 15px; text-align: center;">
        <div style="height: 200px; background: #fafafa; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: #ccc;">[Product Image]</div>
        <h3>{{ product.title }}</h3>
        <p>{{ product.price | money }}</p>
      </div>
    {% endfor %}
  </div>
</div>
{% schema %}
{
  "name": "Collection Products Placeholder",
  "settings": []
}
{% endschema %}`;

    const main404Liquid = `<div style="padding: 120px 20px; text-align: center; max-width: 600px; margin: 0 auto;">
  <h1 style="font-size: 3rem; margin-bottom: 1rem;">404 Page Not Found</h1>
  <p style="color: #666; margin-bottom: 2rem;">The page you are looking for does not exist.</p>
  <a href="/" style="display: inline-block; padding: 10px 25px; background: #000; color: #fff; text-decoration: none; font-weight: bold;">Back to Home</a>
</div>
{% schema %}
{
  "name": "404 Main Content",
  "settings": []
}
{% endschema %}`;

    const mainCartLiquid = `<div style="padding: 80px 20px; max-width: 800px; margin: 0 auto;">
  <h1 style="font-size: 2.5rem; margin-bottom: 2rem;">Your Shopping Cart</h1>
  <p style="color: #666;">Your cart is currently empty.</p>
  <a href="/" style="display: inline-block; margin-top: 1.5rem; padding: 10px 25px; background: #000; color: #fff; text-decoration: none; font-weight: bold;">Continue Shopping</a>
</div>
{% schema %}
{
  "name": "Cart Main Content",
  "settings": []
}
{% endschema %}`;

    zip.file("layout/theme.liquid", themeLiquid);
    zip.file("sections/main-index.liquid", mainIndexLiquid);
    zip.file("sections/main-product.liquid", mainProductLiquid);
    zip.file("sections/main-collection.liquid", mainCollectionLiquid);
    zip.file("sections/main-404.liquid", main404Liquid);
    zip.file("sections/main-cart.liquid", mainCartLiquid);

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
