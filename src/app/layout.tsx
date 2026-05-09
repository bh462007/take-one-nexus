import React from 'react';
import './globals.css';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Space_Mono, Bebas_Neue, Cormorant_Garamond } from 'next/font/google';
import GlobalIssueReporter from '@/components/GlobalIssueReporter';

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-main',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-title',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ['300', '400'],
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TAKE ONE — Film Crew Connect',
  description: 'Where scripts become films. Connect with student filmmakers across campuses.',
  metadataBase: new URL('https://take-one-nexus.vercel.app'),
  openGraph: {
    title: 'TAKE ONE — Film Crew Connect',
    description: 'Where scripts become films. Connect with student filmmakers across campuses.',
    url: 'https://take-one-nexus.vercel.app',
    siteName: 'TAKE ONE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAKE ONE — Film Crew Connect',
    description: 'Where scripts become films. Connect with student filmmakers across campuses.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${bebasNeue.variable} ${cormorantGaramond.variable}`}>
      <head>
        <link rel="stylesheet" href="/styles/components/global-chat-fab.css" />
      </head>
      <body className={`${spaceMono.className}`}>
        <div className="scroll-progress" id="scrollProgress"></div>
        {children}
        <GlobalIssueReporter />
        <Script src="/scripts/components/global-chat-fab.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
