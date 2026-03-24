'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpenText, ChartNoAxesCombined, FolderKanban } from 'lucide-react';
import { BrandMark } from '@/components/branding/BrandMark';
import { useMillyRuntime } from '@/components/runtime/MillyRuntimeProvider';
import { cn, moodColor, shortAddress } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard', icon: ChartNoAxesCombined },
  { href: '/transactions', label: 'Transactions', icon: Activity },
  { href: '/portfolio', label: 'Portfolio', icon: FolderKanban },
  { href: '/docs', label: 'Documentation', icon: BookOpenText },
];

export function Navbar() {
  const pathname = usePathname();
  const { wallet, runtimeOn, mood, confidence } = useMillyRuntime();

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <Link href="/" className="brand-link" aria-label="AGI PF home">
          <BrandMark size="sm" />
          <div className="brand-copy">
            <span className="brand-title">AGI PF</span>
            <span className="brand-subtitle">Milly Autonomous Runtime</span>
          </div>
        </Link>

        <nav className="nav-links">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn('nav-pill', active && 'nav-pill-active')}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={15} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="top-nav-right">
        <div className={cn('status-chip', runtimeOn ? 'status-chip-live' : 'status-chip-paused')}>
          <span className="status-dot" />
          <span>{runtimeOn ? 'Runtime Active' : 'Runtime Paused'}</span>
        </div>

        <div className="agent-chip" style={{ borderColor: `${moodColor(mood)}55` }}>
          <div className="agent-chip-main">
            <span className="agent-chip-label">{mood}</span>
            <span className="agent-chip-meta">Confidence {confidence}%</span>
          </div>
          <div className="agent-chip-wallet">{shortAddress(wallet.publicKey)}</div>
        </div>
      </div>
    </header>
  );
}
