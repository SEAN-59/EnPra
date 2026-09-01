import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

const sans = Source_Sans_3({ variable: '--font-enpra-sans', subsets: ['latin'] });
const serif = Source_Serif_4({ variable: '--font-enpra-serif', subsets: ['latin'] });

export const metadata: Metadata = { title: 'EnPra — English Practice', description: 'A calm, personal space for daily English practice.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable} antialiased`}><Toaster>{children}</Toaster></body></html>;
}
