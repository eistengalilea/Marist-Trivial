/**
 * Paleta del juego según el Manual de la Marca MarCha 2022 (pág. 14):
 *   Azul oscuro #312A4E (color principal) · Lila #87689B · Naranja #D37D00
 *   Verde #869830 · Amarillo #D5A53C
 * Complementada con el magenta #C6007E de marchacompostela.org y el azul
 * marista #3C82B9 de champagnat.org.
 *
 * Todo el tablero 3D y la interfaz leen de aquí, de modo que un cambio de
 * marca se hace en un único sitio. Los tokens equivalentes para Tailwind están
 * en `src/index.css` (@theme).
 */

/** Colores oficiales tal cual aparecen en el manual y las webs de origen. */
export const BRAND = {
  marcha: {
    azulOscuro: '#312A4E', // principal (CMYK 90/95/50/20)
    lila: '#87689B', // CMYK 50/70/10/0
    naranja: '#D37D00', // CMYK 10/65/100/0
    verde: '#869830', // CMYK 60/25/100/0
    amarillo: '#D5A53C', // CMYK 10/40/90/0
    magentaWeb: '#C6007E', // acento de la web
  },
  champagnat: {
    azul: '#3C82B9',
    celeste: '#98C7EB',
    marino: '#053A64',
  },
} as const;

/** Tipografías del manual (pág. 12). */
export const BRAND_FONTS = {
  display: 'Montserrat', // títulos en Semi negrita o Mediano
  text: 'Roboto', // textos
} as const;

/** Tokens semánticos usados por la escena Three.js (números hex). */
const SCENE_COLORS_DARK = {
  night: 0x17132a, // fondo y niebla (azul oscuro MarCha en sombra)
  tableFelt: '#1c1733',
  deckFelt: '#241e3d',
  trackBed: 0x4a3f6e, // vías en violeta medio: el recorrido destaca del fieltro
  tileBezel: 0x312a4e, // azul oscuro MarCha
  gold: 0xd5a53c, // amarillo MarCha
  goldBright: 0xebcb7a,
  goldDeep: 0x9c7420,
  ivory: 0xfbf8f3,
  validRing: 0xffffff,
  validRingHover: 0xebcb7a,
  filterRing: 0xb7a3c6,
  beacon: 0xffffff,
  beaconGlow: 0xd5a53c,
  hemiSky: 0xc9bce0,
  hemiGround: 0x1a1208,
  keyLight: 0xfff4e0,
  rimLight: 0x87689b,
  tokenTray: 0x17132a,
  logoCutout: 0xfbf8f3, // estrella, mano y violetas del símbolo
  dieBody: 0xfbf8f3,
  diePip: 0x312a4e,
  dieOnePip: 0xd37d00,
};

export type GameTheme = 'dark' | 'light';

/**
 * Modo claro: el mismo tablero que la versión imprimible con fondo blanco
 * (tapete blanco, vías en lila muy claro y casillas de color iguales).
 */
const SCENE_COLORS_LIGHT: typeof SCENE_COLORS_DARK = {
  ...SCENE_COLORS_DARK,
  night: 0xe9e5f0,
  tableFelt: '#d9d3e4',
  deckFelt: '#fbf8f3',
  trackBed: 0xe2daec,
  hemiSky: 0xffffff,
  hemiGround: 0x8f86a3,
  tokenTray: 0xd9d3e4,
  // En modo claro el dado es azul oscuro con los puntos blancos.
  dieBody: 0x1a1530, // más oscuro que #312A4E porque la luz clara lo aclara
  diePip: 0xffffff,
  dieOnePip: 0xffffff,
};

/**
 * Colores activos de la escena. Se sustituyen en el sitio con
 * `applySceneTheme` antes de construir la escena.
 */
export const SCENE_COLORS: typeof SCENE_COLORS_DARK = { ...SCENE_COLORS_DARK };

export function applySceneTheme(theme: GameTheme): void {
  Object.assign(SCENE_COLORS, theme === 'light' ? SCENE_COLORS_LIGHT : SCENE_COLORS_DARK);
}


/** Colores CSS usados al pintar texturas en canvas. */
export const CANVAS_COLORS = {
  ivoryLight: '#fdfbf6',
  ivoryDark: '#ece4d4',
  gold: '#d5a53c',
  goldLight: '#ebcb7a',
  goldFrame: 'rgba(251, 248, 243, 0.95)',
  navy: '#312a4e',
  navyDark: '#241e3d',
  navyDeep: '#1c1733',
  white: '#ffffff',
} as const;
