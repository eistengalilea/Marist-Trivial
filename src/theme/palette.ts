/**
 * Paleta Marista del juego.
 *
 * Colores extraídos (estilos computados y variables CSS) de:
 *  - MarCha Compostela  · https://marchacompostela.org  (globales de Elementor)
 *  - Champagnat (Maristas) · https://champagnat.org/es/
 *
 * Todo el tablero 3D y la interfaz leen de aquí, de modo que un cambio de
 * marca se hace en un único sitio. Los tokens equivalentes para Tailwind están
 * en `src/index.css` (@theme).
 */

/** Colores tal cual aparecen en las webs de origen. */
export const BRAND = {
  marcha: {
    primary: '#312A4E', // --e-global-color-primary (violeta profundo)
    secondary: '#1A0087', // --e-global-color-secondary
    accent: '#C6007E', // --e-global-color-accent (magenta, botones)
    gold: '#D5A53C', // fondo destacado y titulares
    blue: '#001489', // banner / cookies
    text: '#3E3D3D',
    lilac: '#87689B',
    purple: '#590093',
    olive: '#869830',
    orange: '#D37D00',
    slateBlue: '#4E639E',
    greyBlue: '#7080A1',
  },
  champagnat: {
    navy: '#053A64', // bloques principales
    navyDark: '#0F314B', // menú y titulares
    navyDeep: '#123652',
    blue: '#3C82B9', // enlaces, botones
    skyLight: '#98C7EB', // bordes y acentos claros
    green: '#62A329', // acento verde
    background: '#F7F7F7',
    textMuted: '#848484',
  },
} as const;

/** Tokens semánticos usados por la escena Three.js (números hex). */
export const SCENE_COLORS = {
  night: 0x071b2e, // fondo y niebla
  tableFelt: '#08213a',
  deckFelt: '#0a2640',
  trackBed: 0x1f527d, // vías más claras que el fieltro: el recorrido se lee mejor
  tileBezel: 0x0f314b,
  gold: 0xd5a53c,
  goldBright: 0xe4bf68,
  goldDeep: 0x9c7420,
  ivory: 0xfbf6ea,
  validRing: 0xf6eacb,
  validRingHover: 0xffffff,
  filterRing: 0x98c7eb,
  beacon: 0xf6eacb,
  beaconGlow: 0xd5a53c,
  hemiSky: 0x98c7eb,
  hemiGround: 0x1a1208,
  keyLight: 0xfff4e0,
  rimLight: 0x3c82b9,
  tokenTray: 0x0a2438,
  dieBody: 0xfbf6ea,
  diePip: 0x053a64,
  dieOnePip: 0xc6007e,
} as const;

/** Colores CSS usados al pintar texturas en canvas. */
export const CANVAS_COLORS = {
  ivoryLight: '#fdfaf1',
  ivoryDark: '#eadfc4',
  gold: '#d5a53c',
  goldLight: '#e4bf68',
  goldFrame: 'rgba(246, 234, 203, 0.95)',
  navy: '#053a64',
  navyDark: '#0f314b',
  navyDeep: '#0a2438',
  white: '#ffffff',
} as const;
