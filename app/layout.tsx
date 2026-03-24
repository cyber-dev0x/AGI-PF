import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MillyRuntimeProvider } from '@/components/runtime/MillyRuntimeProvider';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

const monoFont = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'AGI PF | Milly Autonomous Solana Trading Runtime',
  description:
    'AGI PF monitors Milly, an autonomous Solana trading agent with live execution state, portfolio analytics, and transparent documentation.',
  icons: {
    icon: '/agi-pf-mark.svg',
    shortcut: '/agi-pf-mark.svg',
    apple: '/agi-pf-mark.svg',
  },
  openGraph: {
    title: 'AGI PF | Milly Runtime',
    description: 'Track what Milly buys, sells, and how the balance grows in real time.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${monoFont.variable}`}>
      <body>
        <MillyRuntimeProvider>
          <div className="ambient-layer" />
          <Navbar />

          <div className="app-shell">
            <main className="app-main">{children}</main>
            <Sidebar />
          </div>
        </MillyRuntimeProvider>
      </body>
    </html>
  );
}
