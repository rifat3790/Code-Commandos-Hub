import { NextResponse } from 'next/server';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getAppLink(name: string, isShopify: boolean, detectedTech: string): string {
  const SHOPIFY_APP_LINKS: Record<string, string> = {
    'Klaviyo (Email Marketing)': 'https://apps.shopify.com/klaviyo-email-marketing',
    'Omnisend (Email Marketing)': 'https://apps.shopify.com/omnisend-email-marketing',
    'Mailchimp': 'https://apps.shopify.com/mailchimp',
    'Privy (Popups & Email)': 'https://apps.shopify.com/privy',
    'Justuno (Popups)': 'https://apps.shopify.com/justuno-social-conversion-marketing',
    'Yotpo (Reviews)': 'https://apps.shopify.com/yotpo-social-reviews',
    'Judge.me (Reviews)': 'https://apps.shopify.com/judgeme',
    'Loox (Reviews)': 'https://apps.shopify.com/loox',
    'Stamped.io (Reviews)': 'https://apps.shopify.com/stamped-io-reviews-plus-ugc',
    'AliReviews': 'https://apps.shopify.com/ali-reviews-product-reviews',
    'Ryviu': 'https://apps.shopify.com/ryviu',
    'Gorgias (Customer Service)': 'https://apps.shopify.com/gorgias-chat',
    'Tidio (Live Chat)': 'https://apps.shopify.com/tidio-live-chat',
    'Zendesk / Zopim': 'https://apps.shopify.com/zendesk',
    'Intercom': 'https://apps.shopify.com/intercom',
    'Reamaze': 'https://apps.shopify.com/reamaze',
    'WhatsApp Chat (Elfsight)': 'https://apps.shopify.com/whatsapp-chat-1',
    'Shopify Inbox': 'https://apps.shopify.com/shopify-chat',
    'Recharge (Subscriptions)': 'https://apps.shopify.com/recharge-subscription',
    'Skio (Subscriptions)': 'https://apps.shopify.com/skio',
    'Bold Subscriptions': 'https://apps.shopify.com/bold-subscriptions',
    'Seal Subscriptions': 'https://apps.shopify.com/seal-subscriptions',
    'Appstle (Subscriptions)': 'https://apps.shopify.com/appstle-subscriptions',
    'Smile.io (Loyalty)': 'https://apps.shopify.com/smile-io',
    'LoyaltyLion': 'https://apps.shopify.com/loyaltylion',
    'Growave (Wishlist & Loyalty)': 'https://apps.shopify.com/growave',
    'Joy (Loyalty)': 'https://apps.shopify.com/joy-loyalty',
    'Rivo (Loyalty)': 'https://apps.shopify.com/rivo-loyalty',
    'Swym (Wishlist Plus)': 'https://apps.shopify.com/wishlist-plus',
    'UpPromote (Affiliate)': 'https://apps.shopify.com/uppromote',
    'Refersion (Affiliate)': 'https://apps.shopify.com/refersion',
    'GoAffPro': 'https://apps.shopify.com/goaffpro-affiliate-marketing',
    'PageFly (Page Builder)': 'https://apps.shopify.com/pagefly',
    'Shogun (Page Builder)': 'https://apps.shopify.com/shogun-page-builder',
    'GemPages (Page Builder)': 'https://apps.shopify.com/gempages',
    'EComposer (Page Builder)': 'https://apps.shopify.com/ecomposer',
    'LayoutHub': 'https://apps.shopify.com/layouthub-easy-page-builder',
    'Zipify (Landing Pages)': 'https://apps.shopify.com/zipify-one-click-upsell',
    'Vitals (40+ Apps in One)': 'https://apps.shopify.com/vitals',
    'Hextom (Free Shipping Bar)': 'https://apps.shopify.com/free-shipping-bar',
    'CodeBlackBelt (Frequently Bought Together)': 'https://apps.shopify.com/frequently-bought-together',
    'Rebuy (Personalization)': 'https://apps.shopify.com/rebuy',
    'LimeSpot (Upsell)': 'https://apps.shopify.com/limespot',
    'Wiser (Upsell)': 'https://apps.shopify.com/wiser',
    'Searchanise (Smart Search)': 'https://apps.shopify.com/searchanise',
    'Boost Commerce (Product Filter)': 'https://apps.shopify.com/product-filter-search',
    'Klevu (Search)': 'https://apps.shopify.com/klevu-smart-search',
    'Algolia': 'https://apps.shopify.com/algolia-search-and-discovery',
    'Instafeed (Mintt Studio)': 'https://apps.shopify.com/instafeed',
    'Covet.pics (Shoppable Instagram)': 'https://apps.shopify.com/covet-pics',
    'GSC Instagram Feed': 'https://apps.shopify.com/gsc-instagram',
    'Track123 (Order Tracking)': 'https://apps.shopify.com/track123',
    '17TRACK': 'https://apps.shopify.com/17track',
    'ParcelPanel': 'https://apps.shopify.com/parcelpanel',
    'Route (Package Protection)': 'https://apps.shopify.com/route',
    'AfterShip': 'https://apps.shopify.com/aftership',
    'Printful': 'https://apps.shopify.com/printful',
    'Printify': 'https://apps.shopify.com/printify',
    'Gelato': 'https://apps.shopify.com/gelato',
    'DSers (AliExpress Dropshipping)': 'https://apps.shopify.com/dsers-aliexpress-dropshipping',
    'Spocket': 'https://apps.shopify.com/spocket',
    'CJ Dropshipping': 'https://apps.shopify.com/cjdropshipping',
    'AliOrders': 'https://apps.shopify.com/ali-orders',
    'Eprolo': 'https://apps.shopify.com/eprolo',
    'Order Printer': 'https://apps.shopify.com/shopify-order-printer',
    'Invoice Falcon': 'https://apps.shopify.com/invoice-falcon',
    'Sufio': 'https://apps.shopify.com/sufio',
    'Tapcart (Mobile App Builder)': 'https://apps.shopify.com/tapcart',
    'Vajro': 'https://apps.shopify.com/vajro',
    'Translate & Adapt (Shopify)': 'https://apps.shopify.com/translate-adapt',
    'Langify': 'https://apps.shopify.com/langify',
    'Weglot': 'https://apps.shopify.com/weglot',
    'Transcy': 'https://apps.shopify.com/transcy-translation-currency',
    'BSS B2B / Wholesale': 'https://apps.shopify.com/b2b-wholesale-solution',
    'Wholesale Club': 'https://apps.shopify.com/wholesale-club',
    'Locksmith': 'https://apps.shopify.com/locksmith',
    'SkyPilot (Digital Downloads)': 'https://apps.shopify.com/sky-pilot',
    'SendOwl': 'https://apps.shopify.com/sendowl',
    'Matrixify (Bulk Export/Import)': 'https://apps.shopify.com/excelify',
    'Rewind Backups': 'https://apps.shopify.com/rewind-backups',
    'BeProfit': 'https://apps.shopify.com/beprofit',
    'Lifetimely': 'https://apps.shopify.com/lifetimely',
    'Sezzle (Buy Now Pay Later)': 'https://apps.shopify.com/sezzle',
    'Afterpay': 'https://apps.shopify.com/afterpay',
    'Klarna': 'https://apps.shopify.com/klarna-payments',
    'Affirm': 'https://apps.shopify.com/affirm',
    'Shop Pay': 'https://apps.shopify.com/shop-pay',
    'Globo Product Options': 'https://apps.shopify.com/globo-product-options'
  };

  const WP_PLUGIN_LINKS: Record<string, string> = {
    'WooCommerce (E-commerce)': 'https://wordpress.org/plugins/woocommerce/',
    'Elementor (Page Builder)': 'https://wordpress.org/plugins/elementor/',
    'Yoast SEO': 'https://wordpress.org/plugins/wordpress-seo/',
    'Rank Math SEO': 'https://wordpress.org/plugins/seo-by-rank-math/',
    'Contact Form 7': 'https://wordpress.org/plugins/contact-form-7/',
    'WP Rocket': 'https://wp-rocket.me/',
    'LiteSpeed Cache': 'https://wordpress.org/plugins/litespeed-cache/',
    'Wordfence Security': 'https://wordpress.org/plugins/wordfence/',
    'Jetpack': 'https://wordpress.org/plugins/jetpack/',
    'MonsterInsights': 'https://wordpress.org/plugins/google-analytics-for-wordpress/',
    'Divi Builder': 'https://www.elegantthemes.com/gallery/divi/',
    'WPBakery': 'https://wpbakery.com/',
    'Advanced Custom Fields': 'https://wordpress.org/plugins/advanced-custom-fields/',
    'Smush Image Optimizer': 'https://wordpress.org/plugins/wp-smushit/',
    'All-in-One WP Migration': 'https://wordpress.org/plugins/all-in-one-wp-migration/'
  };

  const WIX_APP_LINKS: Record<string, string> = {
    'Wix Stores (E-commerce)': 'https://www.wix.com/app-market/wix-stores',
    'Wix Chat (Live Chat)': 'https://www.wix.com/app-market/wix-chat',
    'Wix Bookings': 'https://www.wix.com/app-market/wix-bookings',
    'Wix Events': 'https://www.wix.com/app-market/wix-events',
    'Wix Forum': 'https://www.wix.com/app-market/wix-forum'
  };

  const WEBFLOW_INTEGRATION_LINKS: Record<string, string> = {
    'Webflow CMS': 'https://webflow.com/cms',
    'Webflow E-commerce': 'https://webflow.com/ecommerce',
    'Webflow Memberships': 'https://webflow.com/memberships',
    'Finsweet Attributes': 'https://attributes.finsweet.com/',
    'Memberstack': 'https://www.memberstack.com/'
  };

  const SQUARESPACE_EXTENSION_LINKS: Record<string, string> = {
    'Squarespace Commerce': 'https://www.squarespace.com/ecommerce-website',
    'Squarespace Scheduling (Acuity)': 'https://www.squarespace.com/scheduling',
    'Squarespace Blocks': 'https://support.squarespace.com/hc/en-us/articles/206543567-Adding-content-with-blocks'
  };

  const GENERAL_APP_LINKS: Record<string, string> = {
    'Microsoft Clarity': 'https://clarity.microsoft.com/',
    'PayPal': 'https://www.paypal.com',
    'Stripe': 'https://stripe.com',
    'Typeform': 'https://www.typeform.com',
    'Calendly': 'https://calendly.com'
  };

  const cleanName = name.replace(/\s*\((App Block|Script)\)\s*/g, '').trim();

  if (SHOPIFY_APP_LINKS[cleanName]) return SHOPIFY_APP_LINKS[cleanName];
  if (SHOPIFY_APP_LINKS[name]) return SHOPIFY_APP_LINKS[name];
  if (WP_PLUGIN_LINKS[cleanName]) return WP_PLUGIN_LINKS[cleanName];
  if (WP_PLUGIN_LINKS[name]) return WP_PLUGIN_LINKS[name];
  if (WIX_APP_LINKS[cleanName]) return WIX_APP_LINKS[cleanName];
  if (WEBFLOW_INTEGRATION_LINKS[cleanName]) return WEBFLOW_INTEGRATION_LINKS[cleanName];
  if (SQUARESPACE_EXTENSION_LINKS[cleanName]) return SQUARESPACE_EXTENSION_LINKS[cleanName];
  if (GENERAL_APP_LINKS[cleanName]) return GENERAL_APP_LINKS[cleanName];

  if (isShopify || detectedTech === 'Shopify') {
    return `https://apps.shopify.com/search?q=${encodeURIComponent(cleanName)}`;
  } else if (detectedTech.toLowerCase().includes('wordpress') || detectedTech.toLowerCase().includes('woocommerce')) {
    if (/^[a-zA-Z0-9-]+$/.test(cleanName)) {
      return `https://wordpress.org/plugins/${cleanName.toLowerCase()}/`;
    }
    return `https://wordpress.org/plugins/search/${encodeURIComponent(cleanName)}/`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(cleanName)}`;
}

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
    let sessionCookie = '';

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
        
        // Extract all Set-Cookie headers
        const cookies = authRes.headers.getSetCookie ? authRes.headers.getSetCookie() : [];
        if (cookies.length > 0) {
          sessionCookie = cookies.map(c => c.split(';')[0]).join('; ');
          fetchHeaders['Cookie'] = sessionCookie;
        } else {
          // Fallback if getSetCookie isn't available
          const rawCookies = authRes.headers.get('set-cookie');
          if (rawCookies) {
            sessionCookie = rawCookies;
            fetchHeaders['Cookie'] = sessionCookie;
          }
        }
      } catch (err) {
        console.warn('Password authentication failed', err);
      }
    }

    // Fetch homepage to detect tech, theme, and apps
    let html = '';
    let responseHeaders: Record<string, string> = {};

    try {
      const homeRes = await fetch(origin, {
        headers: fetchHeaders,
        next: { revalidate: 0 } // Don't cache so we don't serve password page html to authenticated requests
      });
      
      html = await homeRes.text();
      homeRes.headers.forEach((val, key) => {
        responseHeaders[key.toLowerCase()] = val.toLowerCase();
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
    let detectedApps: { name: string; link: string }[] = [];
    let detectedPixels: string[] = [];
    let socialLinks: string[] = [];
    let emails: string[] = [];

    const addApp = (name: string) => {
      const link = getAppLink(name, isShopify, detectedTech);
      if (!detectedApps.some(app => app.name.toLowerCase() === name.toLowerCase())) {
        detectedApps.push({ name, link });
      }
    };

    // Check Shopify headers & html
    if (responseHeaders['x-shopify-stage'] || responseHeaders['x-shopid'] || html.includes('cdn.shopify.com') || html.includes('Shopify.shop')) {
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

    // Is it password protected?
    if (isShopify && (html.includes('id="password"') || html.includes('class="template-password"') || html.includes('action="/password"') || html.includes('password-page'))) {
      if (!storePassword) {
        return NextResponse.json({
          success: true,
          isShopify: true,
          technology: 'Shopify',
          domain,
          isPasswordProtected: true
        });
      }
    }

    // 1. Theme Extraction
    if (isShopify && !html.includes('class="template-password"')) {
      const SHOPIFY_THEMES: Record<number, string> = {
        887: 'Dawn', 796: 'Prestige', 857: 'Impulse', 838: 'Symmetry', 840: 'Focal',
        1356: 'Impact', 829: 'Pipeline', 1182: 'Kalles', 825: 'Motion', 880: 'Streamline',
        862: 'Envy', 877: 'Warehouse', 843: 'District', 1285: 'Sense', 1286: 'Craft',
        1348: 'Refresh', 1351: 'Studio', 1369: 'Taste', 1352: 'Publisher', 1370: 'Colorblock',
        1349: 'Crave', 1350: 'Origin', 1402: 'Trade', 1401: 'Spotlight', 712: 'Turbo'
      };

      const CUSTOM_THEME_KEYWORDS: Record<string, string> = {
        'minimog': 'Minimog',
        'kalles': 'Kalles',
        'gecko': 'Gecko',
        'ella': 'Ella',
        'wokiee': 'Wokiee',
        'shella': 'Shella',
        'fastor': 'Fastor',
        'porto': 'Porto',
        'basel': 'Basel',
        'woodmart': 'Woodmart',
        'halo': 'Halo',
        'avone': 'Avone',
        'belle': 'Belle'
      };

      const THEME_SIGNATURES: Record<string, string[]> = {
        'Minimog': ['MinimogTheme', 'fox-theme', 'foxkit', 'foxtheme', 'fox-kit'],
        'Kalles': ['t4s-theme', 'kalles-theme', 'the4-theme'],
        'Gecko': ['gecko-theme', 'gecko.css'],
        'Ella': ['halothemes', 'halo-theme', 'ella.css', 'ella-theme'],
        'Wokiee': ['wokiee-theme', 'wokiee.css'],
        'Shella': ['shella-theme', 'shella.css'],
        'Fastor': ['fastor-theme', 'fastor.css'],
        'Porto': ['porto-theme', 'porto.css'],
        'Woodmart': ['woodmart-theme', 'woodmart.css'],
        'Dawn': ['dawn-theme', 'color-background-1', 'section-template--']
      };

      // Search using multiline support
      const themeMatch = html.match(/Shopify\.theme\s*=\s*(\{[\s\S]*?\});/);
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
        // Try matching BOOMR theme variables
        const boomrMatch = html.match(/themeName["']?\s*:\s*["']([^"']+)["']/i) || html.match(/themeName\s*=\s*["']([^"']+)["']/i);
        const boomrIdMatch = html.match(/themeId["']?\s*:\s*(\d+)/i) || html.match(/themeId\s*=\s*(\d+)/i);
        if (boomrMatch) {
          themeInfo = {
            name: boomrMatch[1],
            id: boomrIdMatch ? boomrIdMatch[1] : '',
            role: 'main',
            theme_store_id: null
          };
        }
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
        // Verify via body-level theme signatures (for renamed themes)
        let signatureMatchedTheme = '';
        for (const [themeName, sigs] of Object.entries(THEME_SIGNATURES)) {
          if (sigs.some(sig => html.includes(sig))) {
            signatureMatchedTheme = themeName;
            break;
          }
        }

        if (themeInfo.theme_store_id && SHOPIFY_THEMES[themeInfo.theme_store_id]) {
          themeInfo.originalName = SHOPIFY_THEMES[themeInfo.theme_store_id];
        } else if (signatureMatchedTheme) {
          themeInfo.originalName = signatureMatchedTheme;
        } else {
          // Sort keys by length descending to fix character collision
          let foundCustom = false;
          const lowerName = themeInfo.name.toLowerCase();
          const sortedKeys = Object.keys(CUSTOM_THEME_KEYWORDS).sort((a, b) => b.length - a.length);
          for (const key of sortedKeys) {
            const name = CUSTOM_THEME_KEYWORDS[key];
            if (lowerName.includes(key)) {
              themeInfo.originalName = name;
              foundCustom = true;
              break;
            }
          }
          if (!foundCustom) {
            themeInfo.originalName = themeInfo.theme_store_id ? 'Premium/Other' : 'Custom Built (No ID)';
          }
        }
      } else {
        // Fallback signature-only match if variables completely hidden
        let signatureMatchedTheme = '';
        for (const [themeName, sigs] of Object.entries(THEME_SIGNATURES)) {
          if (sigs.some(sig => html.includes(sig))) {
            signatureMatchedTheme = themeName;
            break;
          }
        }
        if (signatureMatchedTheme) {
          themeInfo = {
            name: signatureMatchedTheme,
            id: 'Detected via Assets',
            role: 'main',
            originalName: signatureMatchedTheme
          };
        }
      }
    } else if (detectedTech.includes('WordPress') || detectedTech.includes('WooCommerce')) {
      const wpThemeMatch = html.match(/\/wp-content\/themes\/([a-zA-Z0-9_-]+)/i);
      if (wpThemeMatch) {
        const cleanName = wpThemeMatch[1].split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        themeInfo = {
          name: cleanName,
          id: wpThemeMatch[1],
          role: 'parent',
          originalName: cleanName
        };
      } else {
        themeInfo = {
          name: 'WordPress Standard Theme',
          id: 'wp-unknown',
          role: 'parent',
          originalName: 'WordPress Theme'
        };
      }
    } else if (detectedTech === 'Wix') {
      themeInfo = {
        name: 'Wix Dynamic Template',
        id: 'wix-site-layout',
        role: 'main',
        originalName: 'Wix Dynamic'
      };
    } else if (detectedTech === 'Webflow') {
      const wfSiteMatch = html.match(/data-wf-site=["']([^"']+)["']/i);
      themeInfo = {
        name: 'Webflow Canvas Layout',
        id: wfSiteMatch ? wfSiteMatch[1] : 'webflow-engine',
        role: 'main',
        originalName: 'Webflow Template'
      };
    } else if (detectedTech === 'Squarespace') {
      const sqMatch = html.match(/templateId["']?\s*:\s*["']([^"']+)["']/i);
      themeInfo = {
        name: 'Squarespace Layout Engine',
        id: sqMatch ? sqMatch[1] : 'squarespace-engine',
        role: 'main',
        originalName: 'Squarespace Template'
      };
    }

    // 2. App & Plugin Stack Extraction (Dictionary based)
    const generalAppSignatures: Record<string, string[]> = {
      'Klaviyo (Email Marketing)': ['klaviyo.com', 'onsite/js/klaviyo.js'],
      'Omnisend (Email Marketing)': ['omnisend.com', 'soundestlink'],
      'Mailchimp': ['mailchimp.com', 'chimpstatic.com'],
      'Privy (Popups & Email)': ['privy.com', 'widget.privy.com'],
      'Justuno (Popups)': ['justuno.com'],
      'Yotpo (Reviews)': ['yotpo.com', 'yotpo_app_key'],
      'Judge.me (Reviews)': ['judge.me', 'jdgm-widget'],
      'Loox (Reviews)': ['loox.io', 'loox-reviews'],
      'Stamped.io (Reviews)': ['stamped.io', 'stamped-reviews'],
      'AliReviews': ['alireviews.io', 'fireapps'],
      'Ryviu': ['ryviu.com'],
      'Gorgias (Customer Service)': ['gorgias.chat', 'gorgias-chat'],
      'Tidio (Live Chat)': ['tidio.chat', 'tidio.co'],
      'Zendesk / Zopim': ['zendesk.com', 'zopim.com'],
      'Intercom': ['intercom.io', 'intercomcdn.com'],
      'Reamaze': ['reamaze.com'],
      'WhatsApp Chat (Elfsight)': ['elfsight.com'],
      'Microsoft Clarity': ['clarity.ms'],
      'PayPal': ['paypal.com/sdk/js', 'paypalobjects.com'],
      'Stripe': ['js.stripe.com'],
      'Typeform': ['typeform.com/embed.js'],
      'Calendly': ['calendly.com/assets/external/widget.js']
    };

    const shopifyAppSignatures: Record<string, string[]> = {
      'Shopify Inbox': ['shopify_chat', 'shopify-chat', 'chat.shopify.com', 'shopify-inbox'],
      'Recharge (Subscriptions)': ['rechargepayments.com', 'recharge-subscription'],
      'Skio (Subscriptions)': ['skio.com', 'skio-plan-picker'],
      'Bold Subscriptions': ['boldapps.net', 'bold-subscriptions'],
      'Seal Subscriptions': ['sealsubscriptions.com'],
      'Appstle (Subscriptions)': ['appstle.com'],
      'Smile.io (Loyalty)': ['smile.io', 'smile-ui'],
      'LoyaltyLion': ['loyaltylion.net', 'lion-loyalty'],
      'Growave (Wishlist & Loyalty)': ['growave.io'],
      'Joy (Loyalty)': ['joyloyalty.com'],
      'Rivo (Loyalty)': ['rivo.io'],
      'Swym (Wishlist Plus)': ['swymrelay.com'],
      'UpPromote (Affiliate)': ['uppromote.com'],
      'Refersion (Affiliate)': ['refersion.com'],
      'GoAffPro': ['goaffpro.com'],
      'PageFly (Page Builder)': ['pagefly.io', 'pagefly-core'],
      'Shogun (Page Builder)': ['getshogun.com', 'shogun-frontend'],
      'GemPages (Page Builder)': ['gempages.net', 'gem-page'],
      'EComposer (Page Builder)': ['ecomposer.app', 'ecomposer'],
      'LayoutHub': ['layouthub.com'],
      'Zipify (Landing Pages)': ['zipify.com'],
      'Vitals (40+ Apps in One)': ['vitals.app'],
      'Hextom (Free Shipping Bar)': ['hextom.com'],
      'CodeBlackBelt (Frequently Bought Together)': ['codeblackbelt.com', 'frequently-bought-together'],
      'Rebuy (Personalization)': ['rebuyengine.com'],
      'LimeSpot (Upsell)': ['limespot.com'],
      'Wiser (Upsell)': ['wiser'],
      'Searchanise (Smart Search)': ['searchanise.com'],
      'Boost Commerce (Product Filter)': ['boostcommerce.net'],
      'Klevu (Search)': ['klevu.com'],
      'Algolia': ['algolia.net'],
      'Instafeed (Mintt Studio)': ['instafeed.minttstudio.com'],
      'Covet.pics (Shoppable Instagram)': ['covet.pics'],
      'GSC Instagram Feed': ['gsc-instagram', 'gsc.io'],
      'Track123 (Order Tracking)': ['track123.com'],
      '17TRACK': ['17track.net'],
      'ParcelPanel': ['parcelpanel.com'],
      'Route (Package Protection)': ['route.com', 'routeapp.io'],
      'AfterShip': ['aftership.com'],
      'Printful': ['printful.com'],
      'Printify': ['printify.com'],
      'Gelato': ['gelato.com'],
      'DSers (AliExpress Dropshipping)': ['dsers.com'],
      'Spocket': ['spocket.co'],
      'CJ Dropshipping': ['cjdropshipping.com'],
      'AliOrders': ['aliorders.com'],
      'Eprolo': ['eprolo.com'],
      'Order Printer': ['order-printer'],
      'Invoice Falcon': ['invoicefalcon.com'],
      'Sufio': ['sufio.com'],
      'Tapcart (Mobile App Builder)': ['tapcart.com'],
      'Vajro': ['vajro.com'],
      'Translate & Adapt (Shopify)': ['translate'],
      'Langify': ['langify-app.com'],
      'Weglot': ['weglot.com'],
      'Transcy': ['transcy.io'],
      'BSS B2B / Wholesale': ['bsscommerce.com'],
      'Wholesale Club': ['wholesale-club'],
      'Locksmith': ['locksmith.website'],
      'Easy Digital Downloads': ['easydigitaldownloads.com'],
      'SkyPilot (Digital Downloads)': ['skypilotapp.com'],
      'SendOwl': ['sendowl.com'],
      'Matrixify (Bulk Export/Import)': ['matrixify.app', 'excelify.io'],
      'Rewind Backups': ['rewind.com'],
      'BeProfit': ['beprofit.co'],
      'Lifetimely': ['lifetimely.io'],
      'Sezzle (Buy Now Pay Later)': ['sezzle.com'],
      'Afterpay': ['afterpay.com'],
      'ClearPay': ['clearpay.com'],
      'Klarna': ['klarna.com', 'klarnaservices.com'],
      'Affirm': ['affirm.com'],
      'Shop Pay': ['shop.app'],
      'Globo Product Options': ['globosoftware.net', 'globo-product-options'],
      'Events Calendar by InlightLabs': ['inlightlabs.com', 'events-calendar'],
      'The Shop Calendar': ['shop-calendar'],
      'Misk Variant Product Options': ['misk-variant', 'misk'],
      'OSync (Order Sync)': ['osync'],
      'Calee': ['calee'],
      'Simesy Checkout Rules': ['simesy']
    };

    const wpPluginSignatures: Record<string, string[]> = {
      'WooCommerce (E-commerce)': ['wp-content/plugins/woocommerce', 'wc-ajax'],
      'Elementor (Page Builder)': ['wp-content/plugins/elementor', 'elementor-layout'],
      'Yoast SEO': ['wp-content/plugins/wordpress-seo', 'yoast-schema-graph'],
      'Rank Math SEO': ['wp-content/plugins/seo-by-rank-math'],
      'Contact Form 7': ['wp-content/plugins/contact-form-7'],
      'WP Rocket': ['wp-content/plugins/wp-rocket', 'wprocket'],
      'LiteSpeed Cache': ['wp-content/plugins/litespeed-cache'],
      'Wordfence Security': ['wp-content/plugins/wordfence'],
      'Jetpack': ['wp-content/plugins/jetpack'],
      'MonsterInsights': ['wp-content/plugins/google-analytics-for-wordpress'],
      'Divi Builder': ['wp-content/themes/Divi', 'et-divi-custom'],
      'WPBakery': ['wp-content/plugins/js_composer'],
      'Advanced Custom Fields': ['wp-content/plugins/advanced-custom-fields'],
      'Smush Image Optimizer': ['wp-content/plugins/wp-smushit'],
      'All-in-One WP Migration': ['wp-content/plugins/all-in-one-wp-migration']
    };

    const wixAppSignatures: Record<string, string[]> = {
      'Wix Stores (E-commerce)': ['wix-stores', 'wixstores'],
      'Wix Chat (Live Chat)': ['wix-chat', 'wixchat'],
      'Wix Bookings': ['wix-bookings'],
      'Wix Events': ['wix-events'],
      'Wix Forum': ['wix-forum']
    };

    const webflowIntegrationSignatures: Record<string, string[]> = {
      'Webflow CMS': ['data-wf-site'],
      'Webflow E-commerce': ['w-commerce-', 'webflow-commerce'],
      'Webflow Memberships': ['w-users-'],
      'Finsweet Attributes': ['fs-attributes'],
      'Memberstack': ['memberstack.js', 'memberstack.io']
    };

    const squarespaceExtensionSignatures: Record<string, string[]> = {
      'Squarespace Commerce': ['squarespace-commerce', 'sqs-shopping-cart'],
      'Squarespace Scheduling (Acuity)': ['acuityscheduling.com', 'acuity-embed'],
      'Squarespace Blocks': ['sqs-block']
    };

    // Scan General SaaS apps
    for (const [appName, signatures] of Object.entries(generalAppSignatures)) {
      if (signatures.some(sig => html.includes(sig))) {
        addApp(appName);
      }
    }

    if (isShopify && !html.includes('class="template-password"')) {
      for (const [appName, signatures] of Object.entries(shopifyAppSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          addApp(appName);
        }
      }

      // 2.1 Dynamic App Block Extraction (OS 2.0)
      const extensionRegex = /cdn\.shopify\.com\/extensions\/[a-zA-Z0-9-]+\/([a-zA-Z0-9-]+)\//g;
      let extMatch;
      while ((extMatch = extensionRegex.exec(html)) !== null) {
         if (extMatch[1]) {
           const rawName = extMatch[1];
           const formattedName = rawName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
           
           const isAlreadyDetected = detectedApps.some(app => app.name.toLowerCase().includes(formattedName.toLowerCase()) || formattedName.toLowerCase().includes(app.name.toLowerCase()));
           
           if (!isAlreadyDetected && formattedName.length > 2 && formattedName.toLowerCase() !== 'assets' && formattedName.toLowerCase() !== 'snippets') {
             addApp(`${formattedName} (App Block)`);
           }
         }
      }

      // 2.2 Global Shopify window.Shopify object app extraction
      const asyncLoadMatch = html.match(/var urls = \[([^\]]+)\]/);
      if (asyncLoadMatch && asyncLoadMatch[1]) {
        const urlsString = asyncLoadMatch[1];
        const domainRegex = /https?:\/\/(?:api\.|cdn\.|www\.)?([a-zA-Z0-9-]+)\.[a-zA-Z0-9-.]+/g;
        let dMatch;
        while ((dMatch = domainRegex.exec(urlsString)) !== null) {
          if (dMatch[1] && !dMatch[1].includes('shopify') && !dMatch[1].includes('trekkie')) {
            const rawName = dMatch[1];
            const formattedName = rawName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            const isAlreadyDetected = detectedApps.some(app => app.name.toLowerCase().includes(formattedName.toLowerCase()) || formattedName.toLowerCase().includes(app.name.toLowerCase()));
            
            if (!isAlreadyDetected && formattedName.length > 2) {
              addApp(`${formattedName} (Script)`);
            }
          }
        }
      }
    } else if (detectedTech.includes('WordPress') || detectedTech.includes('WooCommerce')) {
      for (const [appName, signatures] of Object.entries(wpPluginSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          addApp(appName);
        }
      }
    } else if (detectedTech === 'Wix') {
      for (const [appName, signatures] of Object.entries(wixAppSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          addApp(appName);
        }
      }
    } else if (detectedTech === 'Webflow') {
      for (const [appName, signatures] of Object.entries(webflowIntegrationSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          addApp(appName);
        }
      }
    } else if (detectedTech === 'Squarespace') {
      for (const [appName, signatures] of Object.entries(squarespaceExtensionSignatures)) {
        if (signatures.some(sig => html.includes(sig))) {
          addApp(appName);
        }
      }
    }

    // 3. Pixel & Analytics Scanner (Run on all platforms)
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

    // 4. Social & Contact Extractor (Run on all platforms)
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

    // 5. Fetch Collections (Shopify) or Categories (WooCommerce)
    if (isShopify && !html.includes('class="template-password"')) {
      try {
        const collectionsRes = await fetch(`${origin}/collections.json?limit=250`, {
          headers: fetchHeaders
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
    } else if (detectedTech.includes('WordPress') || detectedTech.includes('WooCommerce')) {
      try {
        const categoriesRes = await fetch(`${origin}/wp-json/wc/store/v1/products/categories`, {
          headers: fetchHeaders
        });
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          if (Array.isArray(categoriesData)) {
            collections = categoriesData.map((c: any) => ({
              id: c.id,
              title: c.name,
              handle: c.slug,
              description: c.description || ''
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch WooCommerce categories', err);
      }
    }

    const speedMetrics = {
      pageSizeKb: html ? Math.round(html.length / 1024) : 0,
      scriptCount: html ? (html.match(/<script/gi) || []).length : 0,
      styleCount: html ? ((html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length + (html.match(/<style/gi) || []).length) : 0,
      imageCount: html ? (html.match(/<img/gi) || []).length : 0,
      lazyImageCount: html ? (html.match(/<img[^>]*loading=["']lazy["']/gi) || []).length : 0,
      preloadCount: html ? (html.match(/<link[^>]*rel=["'](?:preload|preconnect|dns-prefetch)["']/gi) || []).length : 0
    };

    // SEO Auditor Extractions
    const titleMatch = html ? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) : null;
    const seoTitle = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html ? (html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i)) : null;
    const seoDescription = descMatch ? descMatch[1].trim() : '';

    const h1Count = html ? (html.match(/<h1/gi) || []).length : 0;
    const h2Count = html ? (html.match(/<h2/gi) || []).length : 0;

    const ogTitleMatch = html ? html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([\s\S]*?)["']/i) : null;
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : '';

    const ogDescMatch = html ? html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([\s\S]*?)["']/i) : null;
    const ogDescription = ogDescMatch ? ogDescMatch[1].trim() : '';

    const ogImageMatch = html ? html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["']/i) : null;
    const ogImage = ogImageMatch ? ogImageMatch[1].trim() : '';

    // Extract Schemas from application/ld+json
    const schemas: string[] = [];
    const ldJsonMatches = html ? html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) : null;
    if (ldJsonMatches) {
      ldJsonMatches.forEach(scriptTag => {
        const contentMatch = scriptTag.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch && contentMatch[1]) {
          try {
            const parsed = JSON.parse(contentMatch[1].trim());
            const checkType = (obj: any) => {
              if (obj && obj['@type']) {
                if (typeof obj['@type'] === 'string') schemas.push(obj['@type']);
                else if (Array.isArray(obj['@type'])) schemas.push(...obj['@type']);
              }
              if (obj && obj['@graph'] && Array.isArray(obj['@graph'])) {
                obj['@graph'].forEach((g: any) => checkType(g));
              }
            };
            checkType(parsed);
          } catch (e) {}
        }
      });
    }

    // Images without ALT text
    const imgTags = html ? (html.match(/<img[^>]*>/gi) || []) : [];
    let imagesWithoutAlt = 0;
    imgTags.forEach(tag => {
      const hasAlt = /alt=["']([^"']*)["']/i.test(tag);
      if (!hasAlt) {
        imagesWithoutAlt++;
      } else {
        const altMatch = tag.match(/alt=["']([^"']*)["']/i);
        if (altMatch && !altMatch[1].trim()) {
          imagesWithoutAlt++;
        }
      }
    });

    const seoMetrics = {
      seoTitle,
      seoDescription,
      h1Count,
      h2Count,
      ogTitle,
      ogDescription,
      ogImage,
      schemas: Array.from(new Set(schemas)),
      imagesWithoutAlt
    };

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
      emails,
      isPasswordProtected: false,
      sessionCookie,
      speedMetrics,
      seoMetrics
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
