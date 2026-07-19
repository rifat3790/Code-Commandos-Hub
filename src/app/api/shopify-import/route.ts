import { NextResponse } from 'next/server';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopDomain, adminToken, products } = body;

    if (!shopDomain || !adminToken || !products || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: 'Shop domain, Admin token, and products array are required.' }, { status: 400 });
    }

    const cleanDomain = shopDomain.replace(/^https?:\/\//i, '').trim();
    const shopifyUrl = `https://${cleanDomain}/admin/api/2024-04/products.json`;

    const results = [];

    // Import products sequentially to avoid Shopify rate limits (2 requests per second)
    for (const product of products) {
      try {
        // Format variants to match Shopify Admin API schema
        const shopifyVariants = product.variants?.map((v: any) => ({
          price: v.price || '0.00',
          compare_at_price: v.compare_at_price || null,
          sku: v.sku || '',
          option1: v.option1 || null,
          option2: v.option2 || null,
          option3: v.option3 || null,
          inventory_policy: 'deny',
          fulfillment_service: 'manual',
          requires_shipping: v.requires_shipping ?? true,
          taxable: v.taxable ?? true
        })) || [];

        // Format images
        const shopifyImages = product.images?.map((img: any) => ({
          src: img.src,
          alt: img.alt || ''
        })) || [];

        const payload = {
          product: {
            title: product.title,
            body_html: product.body_html || '',
            vendor: product.vendor || 'WooCommerce Import',
            product_type: product.product_type || 'General',
            tags: product.tags || '',
            variants: shopifyVariants,
            images: shopifyImages,
            options: product.options?.map((o: any) => ({ name: o.name })) || []
          }
        };

        const res = await fetch(shopifyUrl, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': adminToken,
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT
          },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();

        if (res.ok && resData.product) {
          results.push({
            title: product.title,
            success: true,
            shopifyId: resData.product.id
          });
        } else {
          results.push({
            title: product.title,
            success: false,
            error: resData.errors ? JSON.stringify(resData.errors) : `Shopify error code ${res.status}`
          });
        }

        // Wait 500ms between calls to respect rate limit
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err: any) {
        results.push({
          title: product.title,
          success: false,
          error: err.message
        });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
