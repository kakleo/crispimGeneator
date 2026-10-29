import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nusa Flores Travel - Tour Proposal Generator',
  description: 'Generate polished, branded tour proposals directly from Google Sheets.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-zinc-50/50">
      <body className="min-h-full bg-zinc-50/50 text-zinc-900 antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
