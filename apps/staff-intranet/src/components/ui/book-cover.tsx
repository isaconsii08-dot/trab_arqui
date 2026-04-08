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
  { bg: '#2A1208', text: '#EDCFC4' },  // dark brown / cream
  { bg: '#1D5E4A', text: '#C4DDD6' },  // emerald / pale green
  { bg: '#6B2A1A', text: '#F5EFE0' },  // terracota / parchment
  { bg: '#1D4ED8', text: '#EDE5CC' },  // blue / warm white
  { bg: '#4A1D96', text: '#F0EAD6' },  // purple / parchment
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
