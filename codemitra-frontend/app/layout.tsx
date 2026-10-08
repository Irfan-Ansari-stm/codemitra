import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | CodeVerse',
    default: 'CodeVerse — Coding Education Platform',
  },
  description:
    'Multi-tenant coding education platform for institutions and learners',
  keywords: [
    'coding',
    'education',
    'platform',
    'programming',
    'learning',
    'judge0',
  ],
  authors: [{ name: 'CodeVerse Team' }],
  creator: 'CodeVerse',
  publisher: 'CodeVerse',
  formatDetection: {
    telephone: false,
  },
  themeColor: '#0A74DA',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codeverse.io',
    siteName: 'CodeVerse',
    title: 'CodeVerse — Coding Education Platform',
    description: 'Learn coding with an interactive, multi-tenant platform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeVerse',
    description: 'Learn coding with an interactive, multi-tenant platform',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
