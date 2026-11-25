import React from 'react';
import { CATEGORIES, CATEGORY_ORDER } from '../game/boardTopology';
import type { CategoryColorId, EmblemKind } from '../game/types';

export const CategoryEmblemSvg: React.FC<{
  emblem: EmblemKind;
  className?: string;
}> = ({ emblem, className = 'w-4 h-4' }) => {
  switch (emblem) {
    case 'compass':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2L20.5 12L12 22L3.5 12L12 2Z" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2.5L14.9 8.6L21.6 9.5L16.7 14.2L17.9 20.9L12 17.7L6.1 20.9L7.3 14.2L2.4 9.5L9.1 8.6L12 2.5Z" />
        </svg>
      );
    case 'hex':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" className={className} aria-hidden="true">
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C18.5 6.2 20 13.5 12 22C4 13.5 5.5 6.2 12 2Z" />
        </svg>
      );
    case 'flame':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2C17.2 7.4 19.2 12 17.5 16.6C16.4 19.5 14.2 21.2 12 21.5C9.8 21.2 7.6 19.5 6.5 16.6C4.8 12 6.8 7.4 12 2Z" />
        </svg>
      );
  }
};

export const WedgeWheelSvg: React.FC<{
  wedges: Record<CategoryColorId, boolean>;
  rimHex: string;
  size?: number;
}> = ({ wedges, rimHex, size = 34 }) => {
  const cx = 50;
  const cy = 50;
  const rInner = 11;
  const rOuter = 38;

  const sectorPath = (idx: number) => {
    const mid = (idx * Math.PI) / 3 - Math.PI / 2;
    const half = Math.PI / 6 - 0.08;
    const a1 = mid - half;
    const a2 = mid + half;
    const x1 = cx + Math.cos(a1) * rInner;
    const y1 = cy + Math.sin(a1) * rInner;
    const x2 = cx + Math.cos(a1) * rOuter;
    const y2 = cy + Math.sin(a1) * rOuter;
    const x3 = cx + Math.cos(a2) * rOuter;
    const y3 = cy + Math.sin(a2) * rOuter;
    const x4 = cx + Math.cos(a2) * rInner;
    const y4 = cy + Math.sin(a2) * rInner;
    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
      aria-label="Progreso de quesitos"
    >
      <circle
        cx={cx}
        cy={cy}
        r={45}
        fill="#0a2438"
        stroke={rimHex}
        strokeWidth="7"
      />
      {CATEGORY_ORDER.map((catId, idx) => {
        const earned = wedges[catId];
        return (
          <path
            key={catId}
            d={sectorPath(idx)}
            fill={earned ? CATEGORIES[catId].hex : '#1a4466'}
            stroke="#0a2438"
            strokeWidth="1.5"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={9} fill="#d5a53c" />
    </svg>
  );
};
