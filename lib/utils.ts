import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNowStrict } from 'date-fns';
import { MoodState } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: number, decimals = 2): string {
  const abs = Math.abs(value);
  if (abs === 0) return '$0.00';
  if (abs < 0.01) return `$${value.toFixed(6)}`;
  if (abs < 1) return `$${value.toFixed(4)}`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(decimals)}`;
}

export function formatPrice(value: number): string {
  if (value >= 100) return `$${value.toFixed(2)}`;
  if (value >= 1) return `$${value.toFixed(4)}`;
  if (value >= 0.01) return `$${value.toFixed(5)}`;
  return `$${value.toFixed(8)}`;
}

export function formatAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return '0.00';
  if (abs < 0.01) return value.toFixed(6);
  if (abs < 1) return value.toFixed(4);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatSigned(value: number, suffix = ''): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}${suffix}`;
}

export function shortAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

export function shortSignature(signature: string): string {
  if (signature.length < 16) return signature;
  return `${signature.slice(0, 7)}...${signature.slice(-7)}`;
}

export function timeAgo(date: Date): string {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function moodColor(mood: MoodState): string {
  switch (mood) {
    case 'Predatory':
      return '#9dff37';
    case 'Analytical':
      return '#36d8ff';
    case 'Cautious':
      return '#ffbf3a';
    case 'Opportunistic':
      return '#ff6e4a';
    default:
      return '#9dff37';
  }
}

export function moodBg(mood: MoodState): string {
  switch (mood) {
    case 'Predatory':
      return 'rgba(157,255,55,0.14)';
    case 'Analytical':
      return 'rgba(54,216,255,0.14)';
    case 'Cautious':
      return 'rgba(255,191,58,0.14)';
    case 'Opportunistic':
      return 'rgba(255,110,74,0.14)';
    default:
      return 'rgba(157,255,55,0.14)';
  }
}
