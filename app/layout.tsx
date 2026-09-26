import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const noto = Heebo({ variable: '--font-hebrew', subsets: ['hebrew'], weight: ['300','400','500','600','700','800'] });
export const metadata: Metadata = {
  metadataBase: new URL('https://sites-project.alonraanan1.workers.dev'),
  title: 'Life OS — מעקב הרגלים אישי',
  description: 'מעקב הרגלים אישי, עם כספים במקום משני.',
  openGraph: { title: 'Life OS', description: 'הרגלים בקצב שלך', images: ['/og.png'], locale: 'he_IL', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Life OS', description: 'הרגלים בקצב שלך', images: ['/og.png'] },
  // Added to an iPhone's Home Screen it opens full screen as "Life OS", with its
  // own icon. No viewport-fit=cover, so the status bar keeps its own strip.
  icons: { icon: '/favicon.svg', apple: '/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest',
  appleWebApp: { title: 'Life OS', statusBarStyle: 'default' },
};
export const viewport: Viewport = { themeColor: '#f8f8fa' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl" className={noto.variable}><body className="antialiased">{children}</body></html>;
}
