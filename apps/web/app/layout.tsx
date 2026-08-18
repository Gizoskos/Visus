import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import './styles.css';

export const metadata: Metadata = {
  title: 'Visual Study Engine',
  description: 'A visual-first academic learning platform.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#101828',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
