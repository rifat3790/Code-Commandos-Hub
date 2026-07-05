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
    let themeInfo: any = null;
    let detectedApps: string[] = [];
    let detectedPixels: string[] = [];
    let socialLinks: string[] = [];
    let emails: string[] = [];

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
      const SHOPIFY_THEMES: Record<number, string> = {
        887: 'Dawn', 796: 'Prestige', 857: 'Impulse', 838: 'Symmetry', 840: 'Focal',
        1356: 'Impact', 829: 'Pipeline', 1182: 'Kalles', 825: 'Motion', 880: 'Streamline',
        862: 'Envy', 877: 'Warehouse', 843: 'District', 1285: 'Sense', 1286: 'Craft',
        1348: 'Refresh', 1351: 'Studio', 1369: 'Taste', 1352: 'Publisher', 1370: 'Colorblock',
        1349: 'Crave', 1350: 'Origin', 1402: 'Trade', 1401: 'Spotlight', 712: 'Turbo'
      };

      const themeMatch = html.match(/Shopify\.theme\s*=\s*(\{.*?\});/);
      if (themeMatch && themeMatch[1]) {
        try {
          const themeData = JSON.parse(themeMatch[1]);
          themeInfo = {
            name: themeData.name || 'Unknown',
            id: themeData.id || '',
            role: themeData.role || '',
            theme_store_id: themeData.theme_store_id
          };
        } catch (e) {}
      }

      if (!themeInfo) {
        const fallbackMatch = html.match(/"themeId":\s*(\d+).*?"themeName":\s*"([^"]+)"/);
        const storeIdMatch = html.match(/"theme_store_id":\s*(\d+)/);
        if (fallbackMatch) {
          themeInfo = { 
            id: fallbackMatch[1], 
            name: fallbackMatch[2], 
            role: 'main', 
            theme_store_id: storeIdMatch ? parseInt(storeIdMatch[1]) : null 
          };
        }
      }

      if (themeInfo) {
        themeInfo.originalName = themeInfo.theme_store_id && SHOPIFY_THEMES[themeInfo.theme_store_id] 
          ? SHOPIFY_THEMES[themeInfo.theme_store_id]
          : (themeInfo.theme_store_id ? 'Premium/Other' : 'Custom Built (No ID)');
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

      // 3. Pixel & Analytics Scanner
      const pixelSignatures: Record<string, string[]> = {
        'Google Analytics (GA4)': ['gtag(', 'googletagmanager.com/gtag/js', 'google-analytics.com/analytics.js'],
        'Meta Pixel (Facebook)': ['fbevents.js', 'fbq('],
        'TikTok Pixel': ['tiktok.com/ttq/analytics', 'ttq.load'],
        'Pinterest Pixel': ['s.pinimg.com/ct/core.js', 'pintrk('],
        'Snapchat Pixel': ['sc-static.net/scevent.min.js', 'snaptr('],
        'Hotjar': ['static.hotjar.com', 'hj('],
        'Triple Whale': ['triplewhale.com', 'twq(']
      };
      
      for (const [pixel, sigs] of Object.entries(pixelSignatures)) {
        if (sigs.some(sig => html.includes(sig))) {
          detectedPixels.push(pixel);
        }
      }

      // 4. Social & Contact Extractor
      const socialRegexs = [
        /https?:\/\/(www\.)?facebook\.com\/[^"'\s<]+/gi,
        /https?:\/\/(www\.)?instagram\.com\/[^"'\s<]+/gi,
        /https?:\/\/(www\.)?tiktok\.com\/@[^"'\s<]+/gi,
        /https?:\/\/(www\.)?twitter\.com\/[^"'\s<]+/gi,
        /https?:\/\/(www\.)?x\.com\/[^"'\s<]+/gi,
        /https?:\/\/(www\.)?youtube\.com\/[^"'\s<]+/gi,
        /https?:\/\/(www\.)?pinterest\.com\/[^"'\s<]+/gi
      ];
      
      const socialsSet = new Set<string>();
      for (const regex of socialRegexs) {
        const matches = html.match(regex);
        if (matches) {
          matches.forEach(m => {
            let clean = m.replace(/["'><].*$/, ''); // clean trailing attributes
            if (!clean.includes('/share') && !clean.includes('/intent') && !clean.includes('policies')) {
              socialsSet.add(clean);
            }
          });
        }
      }
      socialLinks = Array.from(socialsSet);

      const emailMatches = html.match(/mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})/g);
      if (emailMatches) {
        const emailSet = new Set(emailMatches.map(e => e.replace('mailto:', '')));
        emails = Array.from(emailSet);
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
      apps: detectedApps,
      pixels: detectedPixels,
      socials: socialLinks,
      emails
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
