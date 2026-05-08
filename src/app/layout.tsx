import React from 'react';
import './globals.css';
import { Metadata } from 'next';
import Script from 'next/script';


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles/components/global-chat-fab.css" />
      </head>
      <body>
        <div className="scroll-progress" id="scrollProgress"></div>
        {children}
        <Script src="/scripts/components/global-chat-fab.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
