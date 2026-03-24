import { cn } from '@/lib/utils';

interface BrandMarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withText?: boolean;
}

const dimensions = {
  sm: 34,
  md: 42,
  lg: 58,
};

export function BrandMark({ size = 'md', className, withText = false }: BrandMarkProps) {
  const dim = dimensions[size];

  return (
    <div className={cn('brand-mark', className)}>
      <svg width={dim} height={dim} viewBox="0 0 84 84" fill="none" aria-hidden>
        <defs>
          <linearGradient id="millyGreen" x1="6" y1="6" x2="78" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#bcff5b" />
            <stop offset="1" stopColor="#53c219" />
          </linearGradient>
          <linearGradient id="millyCore" x1="20" y1="20" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f1410" />
            <stop offset="1" stopColor="#132214" />
          </linearGradient>
          <filter id="coreGlow" x="0" y="0" width="84" height="84" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2.6" />
          </filter>
        </defs>

        <path
          d="M42 3L74.8 21.9V62.1L42 81L9.2 62.1V21.9L42 3Z"
          fill="url(#millyGreen)"
          stroke="#d6ff9a"
          strokeWidth="1.5"
        />
        <path d="M42 11L67.8 25.9V58.1L42 73L16.2 58.1V25.9L42 11Z" fill="url(#millyCore)" />
        <path
          d="M28 47.5C32.7 56.7 45.1 60.3 54.1 55.5C58.2 53.3 61.3 49.6 62.7 45.1C58.9 39.7 52.4 36.1 45.2 36.1C37.9 36.1 31.4 39.8 27.6 45.2L28 47.5Z"
          fill="#9dff37"
          opacity="0.22"
        />
        <path
          d="M25.5 42.2C30.5 35.4 37.4 31.5 45.2 31.5C53 31.5 60 35.4 65 42.2"
          stroke="#bcff5b"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="45.6" cy="42.1" r="6.6" fill="#bcff5b" />
        <circle cx="45.6" cy="42.1" r="3" fill="#152113" />
        <path
          d="M18.6 25L31 18.3M52.9 65.6L65.4 58.9M18.7 58.9L31.2 65.6"
          stroke="#b8ef63"
          strokeOpacity="0.5"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M42 7.5L74 26.1V57.9L42 76.5L10 57.9V26.1L42 7.5Z"
          stroke="#f2ffd6"
          strokeOpacity="0.26"
        />
        <circle cx="42" cy="42" r="34" fill="#9dff37" opacity="0.08" filter="url(#coreGlow)" />
      </svg>

      {withText ? (
        <div className="brand-copy">
          <span className="brand-title">AGI PF</span>
          <span className="brand-subtitle">Milly Autonomous Runtime</span>
        </div>
      ) : null}
    </div>
  );
}
