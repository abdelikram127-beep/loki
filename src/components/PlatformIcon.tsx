import { useId } from 'react';
import type { Platform } from '../types';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

export function PlatformIcon({ platform, className = 'w-4 h-4' }: PlatformIconProps) {
  const gradId = useId();

  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="35%" stopColor="#DD2A7B" />
            <stop offset="70%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill={`url(#${gradId})`} />
        <rect
          x="5.75"
          y="5.75"
          width="12.5"
          height="12.5"
          rx="3.75"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" r="3.1" fill="none" stroke="#FFFFFF" strokeWidth="1.7" />
        <circle cx="15.8" cy="8.2" r="0.95" fill="#FFFFFF" />
      </svg>
    );
  }

  // TikTok dual-tone cyan + magenta + ink foreground
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#25F4EE"
        d="M18.59 6.09a4.83 4.83 0 0 1-3.77-4.25V1.4h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V8.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 4 19.5a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"
      />
      <path
        fill="#FE2C55"
        d="M20.39 7.29a4.83 4.83 0 0 1-3.77-4.25V2.6h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V10a6.84 6.84 0 0 0-1-.05 6.33 6.33 0 0 0-4.36 10.75A6.34 6.34 0 0 0 16.66 16.27v-7a8.16 8.16 0 0 0 4.77 1.52V7.39a4.85 4.85 0 0 1-1.04-.1z"
      />
      <path
        className="fill-slate-950 dark:fill-white"
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
      />
    </svg>
  );
}
