import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import { Toaster } from '@/components/ui/toast';
import { StaticCopyProvider } from '@/components/static-copy-provider';
import './globals.css';

const sans = Source_Sans_3({ variable: '--font-enpra-sans', subsets: ['latin'] });
const serif = Source_Serif_4({ variable: '--font-enpra-serif', subsets: ['latin'] });

export const metadata: Metadata = { title: 'EnPra — English Practice', description: 'A calm, personal space for daily English practice.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0..1,0" /></head><body className={`${sans.variable} ${serif.variable} antialiased`}><StaticCopyProvider><Toaster>{children}</Toaster></StaticCopyProvider></body></html>;
}
