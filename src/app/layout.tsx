import type { Metadata, Viewport } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = { variable: 'font-sans' };
const geistMono = { variable: 'font-mono' };

export const metadata: Metadata = {
  title: 'Code Commandos Hub',
  description: 'Internal operating system and helper workspace for Shopify developers.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const strip = (el) => {
                  if (el && el.nodeType === 1) {
                    if (el.hasAttribute('bis_skin_checked')) {
                      el.removeAttribute('bis_skin_checked');
                    }
                    const children = el.getElementsByTagName('*');
                    for (let i = 0; i < children.length; i++) {
                      if (children[i].hasAttribute('bis_skin_checked')) {
                        children[i].removeAttribute('bis_skin_checked');
                      }
                    }
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  for (let i = 0; i < mutations.length; i++) {
                    const added = mutations[i].addedNodes;
                    for (let j = 0; j < added.length; j++) {
                      strip(added[j]);
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true
                });
              })();
            `
          }}
        />
      </head>
      <body className="h-full bg-[#030712] text-[#f3f4f6] antialiased overflow-hidden" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
