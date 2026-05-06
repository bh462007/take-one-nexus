import React from 'react';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TAKE ONE — Film Crew Connect',
  description: 'Where scripts become films. Connect with student filmmakers across campuses.',
  viewport: 'width=device-width, initial-scale=1',
  keywords: 'film, crew, college, filmmaking, scripts, collaboration, director, cinematographer',
  authors: [{ name: 'TAKE ONE' }],
  openGraph: {
    type: 'website',
    url: 'https://take-one-nexus.vercel.app/',
    title: 'TAKE ONE — Film Crew Connect',
    description: 'Where scripts become films. Connect with student filmmakers across campuses.',
    siteName: 'TAKE ONE',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="scroll-progress" id="scrollProgress"></div>
        {children}
      </body>
    </html>
  );
}
