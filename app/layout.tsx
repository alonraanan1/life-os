import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const noto = Heebo({ variable: '--font-hebrew', subsets: ['hebrew'], weight: ['300','400','500','600','700','800'] });
export const metadata: Metadata = {
  metadataBase: new URL('https://life-os-personal.arielra230.chatgpt.site'),
  title: 'Life OS — הבית של החיים שלך',
  description: 'כספים, משימות, הרגלים ומטרות — במקום אחד.',
  openGraph: { title: 'Life OS', description: 'הכל במקום אחד', images: ['/og.png'], locale: 'he_IL', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Life OS', description: 'הכל במקום אחד', images: ['/og.png'] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="he" dir="rtl"><body className={`${noto.variable} antialiased`}>{children}</body></html>;
}
