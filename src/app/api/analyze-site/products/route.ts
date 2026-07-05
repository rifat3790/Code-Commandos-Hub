import { NextResponse } from 'next/server';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDomain = searchParams.get('domain');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '250';
    const collection = searchParams.get('collection');
    const storePassword = searchParams.get('storePassword');
    const sessionCookie = searchParams.get('sessionCookie');

    if (!rawDomain) {
      return NextResponse.json({ success: false, error: 'Domain parameter is required.' }, { status: 400 });
    }

    let domain = rawDomain.trim();
    if (!/^https?:\/\//i.test(domain)) {
      domain = 'https://' + domain;
    }

    let fetchHeaders: Record<string, string> = { 'User-Agent': USER_AGENT };

    // Use sessionCookie if passed, or fall back to storePassword login
    if (sessionCookie) {
      fetchHeaders['Cookie'] = sessionCookie;
    } else if (storePassword) {
      const authBody = new URLSearchParams();
      authBody.append('form_type', 'storefront_password');
      authBody.append('password', storePassword);

      try {
        const authRes = await fetch(`${domain}/password`, {
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
        console.warn('Products auth failed', err);
      }
    }

    let url = '';
    if (collection) {
      url = `${domain}/collections/${collection}/products.json?limit=${limit}&page=${page}`;
    } else {
      url = `${domain}/products.json?limit=${limit}&page=${page}`;
    }

    const res = await fetch(url, {
      headers: fetchHeaders,
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Shopify returned status ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, products: data.products || [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
