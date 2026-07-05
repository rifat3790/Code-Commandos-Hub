import { NextResponse } from 'next/server';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUrl = searchParams.get('url');

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

    // Fetch homepage to detect tech, theme, and apps
    let html = '';
    let headers: Record<string, string> = {};

    try {
      const homeRes = await fetch(origin, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 60 }
      });
      
      html = await homeRes.text();
      homeRes.headers.forEach((val, key) => {
        headers[key.toLowerCase()] = val.toLowerCase();
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: `Could not connect to URL: ${err.message}`
      }, { status: 500 });
    }

    let isShopify = false;
    let detectedTech = 'Custom Web Application';
    let collections: any[] = [];
    let themeInfo = null;
    let detectedApps: string[] = [];

    // Check Shopify headers & html
    if (headers['x-shopify-stage'] || headers['x-shopid'] || html.includes('cdn.shopify.com') || html.includes('Shopify.shop')) {
      isShopify = true;
      detectedTech = 'Shopify';
    } else if (html.includes('wp-content/plugins/woocommerce') || html.includes('wc-ajax')) {
      detectedTech = 'WooCommerce (WordPress)';
    } else if (html.includes('wp-content/') || html.includes('wp-includes/')) {
      detectedTech = 'WordPress';
    } else if (html.includes('wixsite') || html.includes('wix.com')) {
      detectedTech = 'Wix';
    } else if (html.includes('static1.squarespace.com') || html.includes('squarespace.com')) {
      detectedTech = 'Squarespace';
    } else if (html.includes('data-wf-page') || html.includes('webflow.css')) {
      detectedTech = 'Webflow';
    } else if (html.includes('Mage.Cookies') || html.includes('/mage/')) {
      detectedTech = 'Magento';
    } else if (html.includes('window.BC_CONFIG') || html.includes('cdn11.bigcommerce.com')) {
      detectedTech = 'BigCommerce';
    } else if (html.includes('prestashop')) {
      detectedTech = 'PrestaShop';
    } else if (html.includes('_next/static') || html.includes('__NEXT_DATA__')) {
      detectedTech = 'Next.js (React)';
    } else if (html.includes('id="___gatsby"') || html.includes('gatsby-')) {
      detectedTech = 'Gatsby (React)';
    } else if (html.includes('nuxt')) {
      detectedTech = 'Nuxt.js (Vue)';
    }

    // Advanced Shopify Extractions
    if (isShopify) {
      // 1. Theme Extraction
      const themeMatch = html.match(/Shopify\.theme\s*=\s*(\{.*?\});/);
      if (themeMatch && themeMatch[1]) {
        try {
          const themeData = JSON.parse(themeMatch[1]);
          themeInfo = {
            name: themeData.name || 'Unknown',
            id: themeData.id || '',
            role: themeData.role || ''
          };
        } catch (e) {}
      }

      // Fallback theme extraction if Shopify.theme is slightly different
      if (!themeInfo) {
        const fallbackMatch = html.match(/"themeId":\s*(\d+).*?"themeName":\s*"([^"]+)"/);
        if (fallbackMatch) {
          themeInfo = { id: fallbackMatch[1], name: fallbackMatch[2], role: 'main' };
        }
      }

      // 2. App Stack Extraction
      const appSignatures: Record<string, string[]> = {
        'Klaviyo': ['klaviyo.com', 'onsite/js/klaviyo.js'],
        'Yotpo': ['yotpo.com', 'yotpo_app_key'],
        'Judge.me': ['judge.me', 'jdgm-widget'],
        'Loox': ['loox.io', 'loox-reviews'],
        'Gorgias': ['gorgias.chat', 'gorgias-chat'],
        'Recharge': ['rechargepayments.com', 'recharge-subscription'],
        'Skio': ['skio.com', 'skio-plan-picker'],
        'Smile.io': ['smile.io', 'smile-ui'],
        'LoyaltyLion': ['loyaltylion.net', 'lion-loyalty'],
        'PageFly': ['pagefly.io', 'pagefly-core'],
        'Shogun': ['getshogun.com', 'shogun-frontend'],
        'GemPages': ['gempages.net', 'gem-page'],
        'Nosto': ['nosto.com', 'nosto-tag'],
        'Sezzle': ['sezzle.com'],
        'Afterpay': ['afterpay.com']
      };

      for (const [appName, signatures] of Object.entries(appSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          detectedApps.push(appName);
        }
      }

      // 3. Fetch Collections
      try {
        const collectionsRes = await fetch(`${origin}/collections.json?limit=250`, {
          headers: { 'User-Agent': USER_AGENT }
        });
        if (collectionsRes.ok) {
          const collectionsData = await collectionsRes.json();
          if (collectionsData && Array.isArray(collectionsData.collections)) {
            collections = collectionsData.collections.map((c: any) => ({
              id: c.id,
              title: c.title,
              handle: c.handle,
              description: c.body_html || ''
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch collections for Shopify store', err);
      }
    }

    return NextResponse.json({
      success: true,
      isShopify,
      technology: detectedTech,
      domain,
      collections,
      theme: themeInfo,
      apps: detectedApps
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
