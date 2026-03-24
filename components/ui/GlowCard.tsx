'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
}

export function GlowCard({
  children,
  className,
  glowColor = 'rgba(118,185,0,0.15)',
  style,
  hoverable = false,
}: GlowCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn('card', className)}
      style={{
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: hovered && hoverable ? `0 0 24px ${glowColor}, inset 0 0 24px ${glowColor}20` : 'none',
        borderColor: hovered && hoverable ? glowColor.replace('0.15', '0.3') : '#1e1e1e',
        ...style,
      }}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
    >
      {children}
    </div>
  );
}
