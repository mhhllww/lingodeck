import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { MSWInit } from './msw-init';
import { BackendInit } from './backend-init';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ShellLayout } from '@/components/layout/ShellLayout';

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
          <AuthProvider>
            <MSWInit />
            <BackendInit />
            <ShellLayout>{children}</ShellLayout>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
