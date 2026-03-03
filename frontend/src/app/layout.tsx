import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { MSWInit } from './msw-init';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'LingoDeck — Personal Vocabulary Notebook',
  description: 'A smart notebook for building your vocabulary. Search, explore, and save words with translations, definitions, and examples.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <MSWInit />
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 min-h-0">
              <Sidebar />
              <main className="flex-1 min-w-0 px-4 py-6 lg:px-8 pb-20 lg:pb-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
