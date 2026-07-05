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

    // Check Shopify directly by hitting products.json
    let isShopify = false;
    let collections: any[] = [];
    let detectedTech = 'Custom Web Application';

    try {
      const prodCheckRes = await fetch(`${origin}/products.json?limit=1`, {
        headers: { 'User-Agent': USER_AGENT },
        next: { revalidate: 60 } // Cache for 60 seconds
      });

      if (prodCheckRes.ok) {
        const prodData = await prodCheckRes.json();
        if (prodData && Array.isArray(prodData.products)) {
          isShopify = true;
          detectedTech = 'Shopify';
        }
      }
    } catch (err) {
      console.warn('Direct products.json check failed, falling back to homepage scrape.', err);
    }

    // If direct check succeeded, load collections too
    if (isShopify) {
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

      return NextResponse.json({
        success: true,
        isShopify: true,
        technology: 'Shopify',
        domain,
        collections
      });
    }

    // Fetch homepage to detect other tech
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

    // Check Shopify headers
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

    // Secondary Shopify verification
    if (isShopify) {
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
        console.warn('Failed to fetch collections for Shopify store (after page parse)', err);
      }
    }

    return NextResponse.json({
      success: true,
      isShopify,
      technology: detectedTech,
      domain,
      collections
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
