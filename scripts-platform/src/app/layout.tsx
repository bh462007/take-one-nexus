import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Script Review | TAKE ONE Nexus',
  description: 'Internal moderation platform for TAKE ONE Nexus script review.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
