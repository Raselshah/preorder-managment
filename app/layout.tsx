import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Preorder Manager',
  description: 'Manage your preorders',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
