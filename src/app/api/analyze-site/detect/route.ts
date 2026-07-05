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
    let detectedApps: string[] = [];
    let detectedPixels: string[] = [];
    let socialLinks: string[] = [];
    let emails: string[] = [];

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

    // Advanced Shopify Extractions
    if (isShopify && !html.includes('class="template-password"')) {
      // 1. Theme Extraction
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
        if (themeInfo.theme_store_id && SHOPIFY_THEMES[themeInfo.theme_store_id]) {
          themeInfo.originalName = SHOPIFY_THEMES[themeInfo.theme_store_id];
        } else {
          // Fallback keyword search for custom themes
          let foundCustom = false;
          const lowerName = themeInfo.name.toLowerCase();
          for (const [key, name] of Object.entries(CUSTOM_THEME_KEYWORDS)) {
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
      }

      // 2. App Stack Extraction
      const appSignatures: Record<string, string[]> = {
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
        'Shopify Inbox': ['shopify_chat', 'shopify-chat'],
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
        'Shop Pay': ['shop.app']
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

      // 5. Fetch Collections
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
      emails,
      isPasswordProtected: false,
      sessionCookie
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
