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
};

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

  if (r < 12) {
    // Top edge: (-S, -S) -> (+S, -S)
    return { x: -S + r * step, z: -S, tileYaw: 0 };
  }
  if (r < 24) {
    // Right edge: (+S, -S) -> (+S, +S)
    return { x: S, z: -S + (r - 12) * step, tileYaw: Math.PI / 2 };
  }
  if (r < 36) {
    // Bottom edge: (+S, +S) -> (-S, +S)
    return { x: S - (r - 24) * step, z: S, tileYaw: Math.PI };
  }
  // Left edge: (-S, +S) -> (-S, -S)
  return { x: -S, z: S - (r - 36) * step, tileYaw: -Math.PI / 2 };
}

export const SQUARE_HQ_PERIMETER_INDICES = [0, 8, 16, 24, 32, 40] as const;

export const SQUARE_SPOKE_ENDPOINTS: Array<{
  x: number;
  z: number;
  angle: number;
  length: number;
}> = SQUARE_HQ_PERIMETER_INDICES.map((rIdx) => {
  const { x, z } = getSquarePerimeterCoords(rIdx);
  return {
    x,
    z,
    angle: Math.atan2(z, x),
    length: Math.hypot(x, z),
  };
});

/**
 * Generates the symmetrical 79-space Square Trivial board topology:
 * - 1 Central Hub ('hub') at (0, 0)
 * - 48 Square Perimeter spaces (12 per side):
 *     - 6 HQ Wedge spaces at indices 0, 8, 16, 24, 32, 40 (including corners 0 and 24)
 *     - 6 'roll_again' spaces at indices 4, 12, 20, 28, 36, 44 (including corners 12 and 36)
 *     - 36 Colored Square Ring spaces (6 per 8-step segment, 6 of each color)
 * - 30 Radial Spoke spaces (6 straight spokes × 5 steps from Hub to each HQ)
 * Total = 1 + 48 + 30 = 79 spaces.
 * Each of the 6 colors appears on exactly 12 spaces (1 HQ + 6 perimeter + 5 spoke).
 */
export function buildTrivialBoard(): {
  spaces: BoardSpace[];
  spaceMap: Map<string, BoardSpace>;
} {
  const spaces: BoardSpace[] = [];
  const spaceMap = new Map<string, BoardSpace>();

  const register = (space: BoardSpace) => {
    spaces.push(space);
    spaceMap.set(space.id, space);
  };

  // 1. Central Hub
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

  // 2. 48 Square Perimeter Spaces (6 HQs + 6 Roll Again + 36 Colored)
  const ringIds: string[] = [];

  for (let arc = 0; arc < 6; arc++) {
    const hqRingIdx = arc * 8;
    const hqCat = CATEGORY_ORDER[arc];
    const hqCoords = getSquarePerimeterCoords(hqRingIdx);
    const hqId = `hq_${arc}`;
    ringIds.push(hqId);

    register({
      id: hqId,
      kind: 'hq',
      category: hqCat,
      position: [hqCoords.x, 0, hqCoords.z],
      angle: hqCoords.tileYaw,
      radius: Math.hypot(hqCoords.x, hqCoords.z),
      neighbors: [],
      spokeIndex: arc,
      spokeStep: 6,
      ringIndex: hqRingIdx,
      label: `Sede de Quesito · ${CATEGORIES[hqCat].shortName}`,
    });

    // 7 spaces between hq_arc and hq_{(arc+1)%6}:
    // sub = 4 is Roll Again; sub = 1,2,3,5,6,7 hold all 6 colors rotated per arc
    const rotatedColors = [
      ...CATEGORY_ORDER.slice(arc),
      ...CATEGORY_ORDER.slice(0, arc),
    ];
    let colorCursor = 0;

    for (let sub = 1; sub <= 7; sub++) {
      const rIdx = hqRingIdx + sub;
      const coords = getSquarePerimeterCoords(rIdx);
      const id = `ring_${rIdx}`;
      ringIds.push(id);

      if (sub === 4) {
        register({
          id,
          kind: 'roll_again',
          category: null,
          position: [coords.x, 0, coords.z],
          angle: coords.tileYaw,
          radius: Math.hypot(coords.x, coords.z),
          neighbors: [],
          spokeIndex: null,
          spokeStep: null,
          ringIndex: rIdx,
          label: 'Vuelve a tirar',
        });
      } else {
        const cat = rotatedColors[colorCursor++];
        register({
          id,
          kind: 'ring',
          category: cat,
          position: [coords.x, 0, coords.z],
          angle: coords.tileYaw,
          radius: Math.hypot(coords.x, coords.z),
          neighbors: [],
          spokeIndex: null,
          spokeStep: null,
          ringIndex: rIdx,
          label: `Casilla Exterior · ${CATEGORIES[cat].shortName}`,
        });
      }
    }
  }

  // 3. 6 Straight Radial Spokes (5 spaces each = 30 spaces)
  for (let i = 0; i < 6; i++) {
    const endpoint = SQUARE_SPOKE_ENDPOINTS[i];
    const isCornerSpoke = i === 0 || i === 3;
    const fractions = isCornerSpoke
      ? [0.22, 0.37, 0.52, 0.67, 0.82]
      : [0.25, 0.4, 0.55, 0.7, 0.85];

    const otherColors = CATEGORY_ORDER.filter((_, idx) => idx !== i);
    const offset = i % 5;
    const spokeColors = [
      ...otherColors.slice(offset),
      ...otherColors.slice(0, offset),
    ];

    for (let step = 1; step <= 5; step++) {
      const frac = fractions[step - 1];
      const x = endpoint.x * frac;
      const z = endpoint.z * frac;
      const cat = spokeColors[step - 1];

      register({
        id: `spoke_${i}_${step}`,
        kind: 'spoke',
        category: cat,
        position: [x, 0, z],
        angle: endpoint.angle,
        radius: endpoint.length * frac,
        neighbors: [],
        spokeIndex: i,
        spokeStep: step,
        ringIndex: null,
        label: `Casilla Radial · ${CATEGORIES[cat].shortName}`,
      });
    }
  }

  // 4. Bidirectional Graph Edges
  const link = (aId: string, bId: string) => {
    const a = spaceMap.get(aId);
    const b = spaceMap.get(bId);
    if (!a || !b) return;
    if (!a.neighbors.includes(bId)) a.neighbors.push(bId);
    if (!b.neighbors.includes(aId)) b.neighbors.push(aId);
  };

  for (let i = 0; i < 6; i++) {
    link('hub', `spoke_${i}_1`);
    for (let step = 1; step < 5; step++) {
      link(`spoke_${i}_${step}`, `spoke_${i}_${step + 1}`);
    }
    link(`spoke_${i}_5`, `hq_${i}`);
  }

  for (let r = 0; r < ringIds.length; r++) {
    link(ringIds[r], ringIds[(r + 1) % ringIds.length]);
  }

  return { spaces, spaceMap };
}

export const TRIVIAL_BOARD = buildTrivialBoard();

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
