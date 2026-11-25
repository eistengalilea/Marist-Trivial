import React from 'react';
import {
  MARCHA_BLUE,
  MARCHA_SYMBOL_PATHS,
  MARCHA_SYMBOL_VIEWBOX,
} from '../brand/marchaSymbol';

/**
 * Símbolo oficial de MarCha. Sobre fondos oscuros el manual (pág. 13) permite
 * la versión en blanco; sobre fondos claros, el azul oscuro original.
 */
export const MarchaSymbol: React.FC<{
  fill?: string;
  className?: string;
  title?: string;
}> = ({ fill = MARCHA_BLUE, className = 'w-6 h-6', title = 'MarCha' }) => (
  <svg
    viewBox={MARCHA_SYMBOL_VIEWBOX}
    className={className}
    role="img"
    aria-label={title}
  >
    {MARCHA_SYMBOL_PATHS.map((d, i) => (
      <path key={i} fill={fill} d={d} />
    ))}
  </svg>
);
