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
      <body className="h-full bg-[#030712] text-[#f3f4f6] antialiased overflow-hidden" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
