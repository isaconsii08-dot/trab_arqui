'use client';

import { useState } from 'react';

interface BookCoverProps {
  src: string | null;
  title: string;
  author?: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  colorIndex?: number;
}

// Paleta de colores para portadas sin imagen
const SPINE_COLORS = [
  { bg: '#2C3E6B', text: '#C9A84C' },
  { bg: '#3D2B1F', text: '#D4A76A' },
  { bg: '#1E3A2F', text: '#7EC8A4' },
  { bg: '#3B1F2B', text: '#D4829A' },
  { bg: '#1F2B3B', text: '#7AABCF' },
  { bg: '#2B2B1F', text: '#C8B87A' },
  { bg: '#3A1F3B', text: '#B87AC8' },
  { bg: '#1F3A3A', text: '#7AC8C8' },
];

function Placeholder({ color, title, author, fill, className }: {
  color: { bg: string; text: string };
  title: string;
  author?: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-3 py-4 text-center ${fill ? 'absolute inset-0' : ''} ${className ?? ''}`}
      style={{ backgroundColor: color.bg }}
    >
      <div
        className="mb-2 w-full border-t border-b py-2"
        style={{ borderColor: `${color.text}40` }}
      >
        <p
          className="line-clamp-4 font-serif text-xs font-semibold leading-snug"
          style={{ color: color.text }}
        >
          {title}
        </p>
      </div>
      {author && (
        <p className="line-clamp-2 font-mono text-[10px] leading-tight" style={{ color: `${color.text}99` }}>
          {author}
        </p>
      )}
    </div>
  );
}

export default function BookCover({
  src,
  title,
  author,
  fill = false,
  className = '',
  colorIndex = 0,
}: BookCoverProps) {
  const [imgError, setImgError] = useState(false);
  const color = SPINE_COLORS[colorIndex % SPINE_COLORS.length]!;

  // Detectar imagen 1×1 transparente que Open Library devuelve cuando no hay portada
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth <= 1 || naturalHeight <= 1) {
      setImgError(true);
    }
  };

  if (!src || imgError) {
    return (
      <Placeholder
        color={color}
        title={title}
        author={author}
        fill={fill}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Portada de ${title}`}
      onLoad={handleLoad}
      onError={() => setImgError(true)}
      style={
        fill
          ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
          : {}
      }
      className={className}
    />
  );
}
