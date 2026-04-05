'use client';

import { useState } from 'react';
import Image from 'next/image';

interface BookCoverProps {
  src: string | null;
  title: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  colorIndex?: number;
}

const COLORS = [
  { bg: '#1a2744', text: '#4ade80' },
  { bg: '#2a1a0e', text: '#fb923c' },
  { bg: '#0e2a1a', text: '#34d399' },
  { bg: '#2a0e1a', text: '#f472b6' },
  { bg: '#0e1a2a', text: '#60a5fa' },
];

export default function BookCover({ src, title, fill = false, sizes, className = '', colorIndex = 0 }: BookCoverProps) {
  const [err, setErr] = useState(false);
  const color = COLORS[colorIndex % COLORS.length]!;

  if (!src || err) {
    return (
      <div
        className={`flex items-center justify-center p-2 text-center ${fill ? 'absolute inset-0' : ''} ${className}`}
        style={{ backgroundColor: color.bg }}
      >
        <p className="line-clamp-3 font-mono text-[10px] font-medium leading-snug" style={{ color: color.text }}>
          {title}
        </p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={title}
      fill={fill}
      sizes={sizes}
      className={className}
      onError={() => setErr(true)}
    />
  );
}
