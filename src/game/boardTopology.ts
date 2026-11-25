import type {
  BoardSpace,
  CategoryColorId,
  CategoryConfig,
  DifficultyConfig,
  DifficultyLevel,
  MatchLength,
  MatchLengthConfig,
} from './types';

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['easy', 'medium', 'hard'];

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Fácil',
    cpuAccuracy: 0.45,
    summary: 'Preguntas accesibles de cultura general',
  },
  medium: {
    id: 'medium',
    label: 'Medio',
    cpuAccuracy: 0.65,
    summary: 'Preguntas de dificultad intermedia',
  },
  hard: {
    id: 'hard',
    label: 'Difícil',
    cpuAccuracy: 0.82,
    summary: 'Preguntas exigentes y específicas',
  },
};

export const MATCH_LENGTH_ORDER: MatchLength[] = ['short', 'medium', 'long'];

export const MATCH_LENGTH_CONFIGS: Record<MatchLength, MatchLengthConfig> = {
  short: {
    id: 'short',
    label: 'Rápida',
    questionsPerWedge: 1,
    summary: 'Acertar 1 pregunta del mismo color para conseguir cada quesito',
  },
  medium: {
    id: 'medium',
    label: 'Media',
    questionsPerWedge: 2,
    summary: 'Acertar 2 preguntas del mismo color para conseguir cada quesito',
  },
  long: {
    id: 'long',
    label: 'Larga',
    questionsPerWedge: 4,
    summary: 'Acertar 4 preguntas del mismo color para conseguir cada quesito',
  },
};

export const CATEGORY_ORDER: CategoryColorId[] = [
  'blue',
  'pink',
  'yellow',
  'purple',
  'green',
  'orange',
];

/**
 * Categorías temáticas de Marist Trivial. Los colores siguen el Manual de la
 * Marca MarCha 2022 (amarillo #D5A53C, lila #87689B, naranja #D37D00, verde
 * #869830); el azul es el azul marista #3C82B9 (el azul oscuro #312A4E de la
 * marca se reserva para fondos) y el rosa es el magenta #C6007E de la web de
 * MarCha. Cada categoría lleva además un emblema propio para no depender
 * solo del color.
 */
export const CATEGORIES: Record<CategoryColorId, CategoryConfig> = {
  blue: {
    id: 'blue',
    name: 'Geografía e historia marista',
    shortName: 'Geografía e historia',
    colorName: 'Azul',
    hex: '#3C82B9',
    lightHex: '#8FBCE0',
    darkHex: '#1F527D',
    emblem: 'compass',
  },
  pink: {
    id: 'pink',
    name: 'Arte y Literatura',
    shortName: 'Arte y Literatura',
    colorName: 'Rosa',
    hex: '#C6007E',
    lightHex: '#E85AAE',
    darkHex: '#7A004E',
    emblem: 'diamond',
  },
  yellow: {
    id: 'yellow',
    name: 'Historia universal',
    shortName: 'Historia universal',
    colorName: 'Amarillo',
    hex: '#D5A53C',
    lightHex: '#EBCB7A',
    darkHex: '#9C7420',
    emblem: 'star',
  },
  purple: {
    id: 'purple',
    name: 'MarCha',
    shortName: 'MarCha',
    colorName: 'Morado',
    hex: '#87689B',
    lightHex: '#B7A3C6',
    darkHex: '#5A4270',
    emblem: 'hex',
  },
  green: {
    id: 'green',
    name: 'Ciencias y Naturaleza',
    shortName: 'Ciencias',
    colorName: 'Verde',
    hex: '#869830',
    lightHex: '#B2C25E',
    darkHex: '#566318',
    emblem: 'leaf',
  },
  orange: {
    id: 'orange',
    name: 'Deportes y Pasatiempos u Ocio',
    shortName: 'Deportes y Ocio',
    colorName: 'Naranja',
    hex: '#D37D00',
    lightHex: '#F0A040',
    darkHex: '#8A4A00',
    emblem: 'flame',
  },
};

export const BOARD_DIMENSIONS = {
  hubRadius: 1.55,
  squareHalfSpan: 9.6, // Outer square center-line half-width (-9.6 .. +9.6)
  squareStep: 1.6, // 12 steps per side = 48 perimeter spaces
  boardOuterHalf: 11.45, // Walnut plinth outer half-width
  circleRadius: 9.95, // Radio del circuito exterior en el tablero circular
};

/** Forma del tablero, igual que en los materiales imprimibles. */
export type BoardLayout = 'square' | 'circle';
export const BOARD_LAYOUTS: BoardLayout[] = ['square', 'circle'];

/**
 * Returns (x, z) and tile orientation angle for index `r` (0..47) along the
 * 13x13 square perimeter clockwise starting at Top-Left corner (-9.6, -9.6).
 */
function getSquarePerimeterCoords(r: number): {
  x: number;
  z: number;
  tileYaw: number;
} {
  const S = BOARD_DIMENSIONS.squareHalfSpan;
  const step = BOARD_DIMENSIONS.squareStep;

  if (r < 12) return { x: -S + r * step, z: -S, tileYaw: 0 };
  if (r < 24) return { x: S, z: -S + (r - 12) * step, tileYaw: Math.PI / 2 };
  if (r < 36) return { x: S - (r - 24) * step, z: S, tileYaw: Math.PI };
  return { x: -S, z: S - (r - 36) * step, tileYaw: -Math.PI / 2 };
}

/** Casillas del circuito circular: 48 posiciones; sedes en 30°, 90°, 150°… */
function getCirclePerimeterCoords(r: number): { x: number; z: number; tileYaw: number } {
  const R = BOARD_DIMENSIONS.circleRadius;
  const a = -Math.PI / 3 + (r * 2 * Math.PI) / 48;
  return { x: Math.cos(a) * R, z: Math.sin(a) * R, tileYaw: a + Math.PI / 2 };
}

interface LayoutSpec {
  coords: (r: number) => { x: number; z: number; tileYaw: number };
  /** Índices del circuito donde están las 6 sedes, en el orden de CATEGORY_ORDER. */
  hq: number[];
  roll: number[];
  /** Colores de las 36 casillas de color del circuito, en orden. */
  ringColors: CategoryColorId[];
}

function squareRingColors(hq: number[], roll: number[]): CategoryColorId[] {
  const special = new Map<number, CategoryColorId | null>();
  hq.forEach((r, i) => special.set(r, CATEGORY_ORDER[i]));
  roll.forEach((r) => special.set(r, null));
  const colored = Array.from({ length: 48 }, (_, r) => r).filter((r) => !special.has(r));
  // 6 de cada color en secuencia, evitando que una casilla toque la sede de su mismo color
  for (let off = 0; off < 6; off++) {
    const seq = colored.map((_, k) => CATEGORY_ORDER[(k + off) % 6]);
    const ok = colored.every((r, k) =>
      [(r + 47) % 48, (r + 1) % 48].every((nb) => special.get(nb) !== seq[k]),
    );
    if (ok) return seq;
  }
  return colored.map((_, k) => CATEGORY_ORDER[k % 6]);
}

function layoutSpec(layout: BoardLayout): LayoutSpec {
  if (layout === 'square') {
    // Sedes en las 4 esquinas y en el centro de los laterales izquierdo y derecho
    const hq = [0, 12, 18, 24, 36, 42];
    const roll = [6, 15, 21, 30, 39, 45];
    return { coords: getSquarePerimeterCoords, hq, roll, ringColors: squareRingColors(hq, roll) };
  }
  // Circular: una sede cada 8 casillas, «vuelve a tirar» en medio de cada tramo
  const hq = [0, 8, 16, 24, 32, 40];
  const roll = hq.map((r) => r + 4);
  const ringColors: CategoryColorId[] = [];
  for (let arc = 0; arc < 6; arc++) {
    const rot = [...CATEGORY_ORDER.slice(arc), ...CATEGORY_ORDER.slice(0, arc)];
    ringColors.push(...rot);
  }
  return { coords: getCirclePerimeterCoords, hq, roll, ringColors };
}

export interface SpokeEndpoint {
  x: number;
  z: number;
  angle: number;
  length: number;
}

/**
 * Extremos de los 6 radios (centro → sede) del tablero activo. Se actualiza
 * en el sitio al cambiar de forma, por eso es un array mutable.
 */
export const SQUARE_SPOKE_ENDPOINTS: SpokeEndpoint[] = [];

/**
 * Builds the 79-space board for a layout:
 * - 1 Central Hub ('hub') at (0, 0)
 * - 48 perimeter spaces: 6 HQs, 6 'roll_again' and 36 coloured (6 per colour)
 * - 30 Radial Spoke spaces (6 straight spokes × 5 steps from Hub to each HQ)
 * Each of the 6 colors appears on exactly 12 spaces (1 HQ + 6 perimeter + 5 spoke).
 */
export function buildTrivialBoard(layout: BoardLayout = 'square'): {
  spaces: BoardSpace[];
  spaceMap: Map<string, BoardSpace>;
  spokeEndpoints: SpokeEndpoint[];
} {
  const spaces: BoardSpace[] = [];
  const spaceMap = new Map<string, BoardSpace>();
  const spec = layoutSpec(layout);

  const register = (space: BoardSpace) => {
    spaces.push(space);
    spaceMap.set(space.id, space);
  };

  register({
    id: 'hub',
    kind: 'hub',
    category: null,
    position: [0, 0, 0],
    angle: 0,
    radius: 0,
    neighbors: [],
    spokeIndex: null,
    spokeStep: null,
    ringIndex: null,
    label: 'Casilla Central',
  });

  // Circuito exterior, en orden (los ids de sede son hq_0..hq_5)
  const ringIds: string[] = [];
  let colorCursor = 0;
  for (let r = 0; r < 48; r++) {
    const c = spec.coords(r);
    const base = {
      position: [c.x, 0, c.z] as [number, number, number],
      angle: c.tileYaw,
      radius: Math.hypot(c.x, c.z),
      neighbors: [],
      spokeStep: null,
      ringIndex: r,
    };
    const hqIdx = spec.hq.indexOf(r);
    if (hqIdx >= 0) {
      const cat = CATEGORY_ORDER[hqIdx];
      register({
        ...base,
        id: `hq_${hqIdx}`,
        kind: 'hq',
        category: cat,
        spokeIndex: hqIdx,
        spokeStep: 6,
        label: `Sede de Quesito · ${CATEGORIES[cat].shortName}`,
      });
      ringIds.push(`hq_${hqIdx}`);
    } else if (spec.roll.includes(r)) {
      register({ ...base, id: `ring_${r}`, kind: 'roll_again', category: null, spokeIndex: null, label: 'Vuelve a tirar' });
      ringIds.push(`ring_${r}`);
    } else {
      const cat = spec.ringColors[colorCursor++];
      register({
        ...base,
        id: `ring_${r}`,
        kind: 'ring',
        category: cat,
        spokeIndex: null,
        label: `Casilla Exterior · ${CATEGORIES[cat].shortName}`,
      });
      ringIds.push(`ring_${r}`);
    }
  }

  // 6 radios rectos de 5 casillas, repartidas a la misma distancia
  const spokeEndpoints: SpokeEndpoint[] = [];
  for (let i = 0; i < 6; i++) {
    const hq = spaceMap.get(`hq_${i}`)!;
    const [ex, , ez] = hq.position;
    const length = Math.hypot(ex, ez);
    const angle = Math.atan2(ez, ex);
    spokeEndpoints.push({ x: ex, z: ez, angle, length });

    const otherColors = CATEGORY_ORDER.filter((_, idx) => idx !== i);
    const offset = i % 5;
    const spokeColors = [...otherColors.slice(offset), ...otherColors.slice(0, offset)];
    const d0 = BOARD_DIMENSIONS.hubRadius + 0.95;
    const d1 = length - 1.3;

    for (let step = 1; step <= 5; step++) {
      const d = d0 + ((d1 - d0) * (step - 1)) / 4;
      const cat = spokeColors[step - 1];
      register({
        id: `spoke_${i}_${step}`,
        kind: 'spoke',
        category: cat,
        position: [Math.cos(angle) * d, 0, Math.sin(angle) * d],
        angle,
        radius: d,
        neighbors: [],
        spokeIndex: i,
        spokeStep: step,
        ringIndex: null,
        label: `Casilla Radial · ${CATEGORIES[cat].shortName}`,
      });
    }
  }

  const link = (aId: string, bId: string) => {
    const a = spaceMap.get(aId);
    const b = spaceMap.get(bId);
    if (!a || !b) return;
    if (!a.neighbors.includes(bId)) a.neighbors.push(bId);
    if (!b.neighbors.includes(aId)) b.neighbors.push(aId);
  };

  for (let i = 0; i < 6; i++) {
    link('hub', `spoke_${i}_1`);
    for (let step = 1; step < 5; step++) link(`spoke_${i}_${step}`, `spoke_${i}_${step + 1}`);
    link(`spoke_${i}_5`, `hq_${i}`);
  }
  for (let r = 0; r < ringIds.length; r++) link(ringIds[r], ringIds[(r + 1) % ringIds.length]);

  return { spaces, spaceMap, spokeEndpoints };
}

/**
 * Tablero activo. Es un único objeto cuyo contenido se sustituye en el sitio
 * con `setBoardLayout`, así todos los módulos que lo importan ven el cambio.
 */
export const TRIVIAL_BOARD: {
  layout: BoardLayout;
  spaces: BoardSpace[];
  spaceMap: Map<string, BoardSpace>;
} = { layout: 'square', spaces: [], spaceMap: new Map() };

export function setBoardLayout(layout: BoardLayout): void {
  const built = buildTrivialBoard(layout);
  TRIVIAL_BOARD.layout = layout;
  TRIVIAL_BOARD.spaces.length = 0;
  TRIVIAL_BOARD.spaces.push(...built.spaces);
  TRIVIAL_BOARD.spaceMap.clear();
  built.spaceMap.forEach((v, k) => TRIVIAL_BOARD.spaceMap.set(k, v));
  SQUARE_SPOKE_ENDPOINTS.length = 0;
  SQUARE_SPOKE_ENDPOINTS.push(...built.spokeEndpoints);
  distanceCache.delete(TRIVIAL_BOARD.spaceMap);
}

/**
 * Finds all valid destinations at exact distance `steps` from `startSpaceId`
 * with no immediate direction reversal within a single roll.
 */
export function findValidMoves(
  startSpaceId: string,
  steps: number,
  spaceMap: Map<string, BoardSpace> = TRIVIAL_BOARD.spaceMap,
): Map<string, string[]> {
  const results = new Map<string, string[]>();
  if (steps <= 0) return results;

  const dfs = (currentId: string, prevId: string | null, path: string[]) => {
    if (path.length - 1 === steps) {
      if (!results.has(currentId)) {
        results.set(currentId, [...path]);
      }
      return;
    }

    const current = spaceMap.get(currentId);
    if (!current) return;

    for (const nextId of current.neighbors) {
      if (nextId === prevId) continue;
      if (path.includes(nextId)) continue;
      path.push(nextId);
      dfs(nextId, currentId, path);
      path.pop();
    }
  };

  dfs(startSpaceId, null, [startSpaceId]);
  return results;
}

/**
 * Tabla de distancias precalculada (BFS desde cada casilla) para el tablero
 * por defecto. El tablero tiene 79 casillas, así que la tabla completa ocupa
 * ~6.000 entradas y convierte cada consulta de la IA en O(1) en lugar de un
 * BFS completo por cada destino candidato.
 */
const distanceCache = new WeakMap<
  Map<string, BoardSpace>,
  Map<string, Map<string, number>>
>();

function bfsDistances(
  fromId: string,
  spaceMap: Map<string, BoardSpace>,
): Map<string, number> {
  const dist = new Map<string, number>([[fromId, 0]]);
  const queue: string[] = [fromId];
  for (let head = 0; head < queue.length; head++) {
    const curr = queue[head];
    const d = dist.get(curr)!;
    const space = spaceMap.get(curr);
    if (!space) continue;
    for (const n of space.neighbors) {
      if (!dist.has(n)) {
        dist.set(n, d + 1);
        queue.push(n);
      }
    }
  }
  return dist;
}

export function shortestGraphDistance(
  fromId: string,
  toId: string,
  spaceMap: Map<string, BoardSpace> = TRIVIAL_BOARD.spaceMap,
): number {
  if (fromId === toId) return 0;
  let table = distanceCache.get(spaceMap);
  if (!table) {
    table = new Map();
    distanceCache.set(spaceMap, table);
  }
  let fromDistances = table.get(fromId);
  if (!fromDistances) {
    fromDistances = bfsDistances(fromId, spaceMap);
    table.set(fromId, fromDistances);
  }
  return fromDistances.get(toId) ?? Infinity;
}

setBoardLayout('square');

export function countPlayerWedges(wedges: Record<CategoryColorId, boolean>): number {
  return CATEGORY_ORDER.reduce((acc, c) => acc + (wedges[c] ? 1 : 0), 0);
}

export function createEmptyWedges(): Record<CategoryColorId, boolean> {
  return {
    blue: false,
    pink: false,
    yellow: false,
    purple: false,
    green: false,
    orange: false,
  };
}

export function createEmptyCategoryProgress(): Record<CategoryColorId, number> {
  return {
    blue: 0,
    pink: 0,
    yellow: 0,
    purple: 0,
    green: 0,
    orange: 0,
  };
}
