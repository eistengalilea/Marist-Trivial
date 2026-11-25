import * as THREE from 'three';
import { SCENE_COLORS } from '../theme/palette';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { marchaSymbolSvg } from '../brand/marchaSymbol';
import {
  BOARD_DIMENSIONS,
  CATEGORIES,
  CATEGORY_ORDER,
  SQUARE_SPOKE_ENDPOINTS,
  TRIVIAL_BOARD,
} from '../game/boardTopology';
import type { BoardSpace, CategoryColorId } from '../game/types';
import {
  createCategoryTileTexture,
  createContactShadowTexture,
  createFeltTexture,
  createHubMedallionTexture,
  createRollAgainTileTexture,
  createWalnutWoodTexture,
} from './proceduralTextures';

export interface TileVisual {
  space: BoardSpace;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  faceMesh: THREE.Mesh;
  bezelMat: THREE.MeshStandardMaterial;
  faceMat: THREE.MeshPhysicalMaterial;
  highlightRing: THREE.Mesh;
  beaconGroup: THREE.Group;
  baseY: number;
}

export interface PlayerTokenVisual {
  playerId: string;
  group: THREE.Group;
  bodyGroup: THREE.Group;
  wedges: Record<CategoryColorId, THREE.Mesh>;
  wedgeAnimProgress: Record<CategoryColorId, number>;
  shadowPlane: THREE.Mesh;
  /** Símbolo 3D de MarCha que se gira hacia la cámara. */
  logoGroup: THREE.Group;
}

export interface CardCaddyVisual {
  group: THREE.Group;
  topCards: Record<CategoryColorId, THREE.Mesh>;
  baseY: Record<CategoryColorId, number>;
}

export function getSpaceSurfaceY(space: BoardSpace): number {
  if (space.kind === 'hub' || space.kind === 'hq') return 0.22;
  return 0.16;
}

function createSquareRingGeometry(
  outerHalf: number,
  innerHalf: number,
  depth: number,
  bevelRadius = 0,
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const r = bevelRadius;
  if (r > 0) {
    shape.moveTo(-outerHalf + r, -outerHalf);
    shape.lineTo(outerHalf - r, -outerHalf);
    shape.quadraticCurveTo(outerHalf, -outerHalf, outerHalf, -outerHalf + r);
    shape.lineTo(outerHalf, outerHalf - r);
    shape.quadraticCurveTo(outerHalf, outerHalf, outerHalf - r, outerHalf);
    shape.lineTo(-outerHalf + r, outerHalf);
    shape.quadraticCurveTo(-outerHalf, outerHalf, -outerHalf, outerHalf - r);
    shape.lineTo(-outerHalf, -outerHalf + r);
    shape.quadraticCurveTo(-outerHalf, -outerHalf, -outerHalf + r, -outerHalf);
  } else {
    shape.moveTo(-outerHalf, -outerHalf);
    shape.lineTo(outerHalf, -outerHalf);
    shape.lineTo(outerHalf, outerHalf);
    shape.lineTo(-outerHalf, outerHalf);
    shape.closePath();
  }

  const hole = new THREE.Path();
  hole.moveTo(-innerHalf, -innerHalf);
  hole.lineTo(-innerHalf, innerHalf);
  hole.lineTo(innerHalf, innerHalf);
  hole.lineTo(innerHalf, -innerHalf);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function buildBoardAssembly(maxAnisotropy: number): {
  boardGroup: THREE.Group;
  tileVisuals: Map<string, TileVisual>;
  clickableMeshes: THREE.Mesh[];
  disposables: Array<{ dispose: () => void }>;
  /** Recursos reutilizables por la bandeja del dado y el portacartas. */
  shared: {
    walnutMat: THREE.MeshStandardMaterial;
    catTileTextures: Record<CategoryColorId, THREE.CanvasTexture>;
  };
} {
  const boardGroup = new THREE.Group();
  const tileVisuals = new Map<string, TileVisual>();
  const clickableMeshes: THREE.Mesh[] = [];
  const disposables: Array<{ dispose: () => void }> = [];

  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Shared procedural textures
  const walnutTex = track(createWalnutWoodTexture(maxAnisotropy));
  const feltBoardTex = track(createFeltTexture(SCENE_COLORS.deckFelt, maxAnisotropy, 6));
  const tableFeltTex = track(createFeltTexture(SCENE_COLORS.tableFelt, maxAnisotropy, 18));
  const hubTex = track(createHubMedallionTexture(maxAnisotropy));
  const rollAgainTex = track(createRollAgainTileTexture(maxAnisotropy));
  const shadowTex = track(createContactShadowTexture());

  const catTileTextures: Record<CategoryColorId, THREE.CanvasTexture> = {
    blue: track(createCategoryTileTexture('blue', false, maxAnisotropy)),
    pink: track(createCategoryTileTexture('pink', false, maxAnisotropy)),
    yellow: track(createCategoryTileTexture('yellow', false, maxAnisotropy)),
    purple: track(createCategoryTileTexture('purple', false, maxAnisotropy)),
    green: track(createCategoryTileTexture('green', false, maxAnisotropy)),
    orange: track(createCategoryTileTexture('orange', false, maxAnisotropy)),
  };

  const hqTileTextures: Record<CategoryColorId, THREE.CanvasTexture> = {
    blue: track(createCategoryTileTexture('blue', true, maxAnisotropy)),
    pink: track(createCategoryTileTexture('pink', true, maxAnisotropy)),
    yellow: track(createCategoryTileTexture('yellow', true, maxAnisotropy)),
    purple: track(createCategoryTileTexture('purple', true, maxAnisotropy)),
    green: track(createCategoryTileTexture('green', true, maxAnisotropy)),
    orange: track(createCategoryTileTexture('orange', true, maxAnisotropy)),
  };

  // Materiales PBR compartidos. Los biseles de casilla no cambian en tiempo
  // de ejecución, así que se usan 2 materiales en lugar de 78 instancias.
  const hqBezelMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.gold,
      roughness: 0.25,
      metalness: 0.88,
    }),
  );
  const tileBezelMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.tileBezel,
      roughness: 0.65,
      metalness: 0.22,
    }),
  );

  const walnutMat = track(
    new THREE.MeshStandardMaterial({
      map: walnutTex,
      roughness: 0.48,
      metalness: 0.06,
    }),
  );

  const brassMat = track(
    new THREE.MeshPhysicalMaterial({
      color: SCENE_COLORS.gold,
      roughness: 0.24,
      metalness: 0.92,
      anisotropy: 0.65,
      clearcoat: 0.25,
    }),
  );

  const darkSlateMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.trackBed,
      roughness: 0.72,
      metalness: 0.12,
    }),
  );

  const feltMat = track(
    new THREE.MeshStandardMaterial({
      map: feltBoardTex,
      roughness: 0.92,
      metalness: 0.0,
    }),
  );

  // 1. Studio Tabletop Stage (grounded environment extending to horizon fog)
  const tableGeo = track(new THREE.BoxGeometry(150, 0.4, 150));
  const tableMat = track(
    new THREE.MeshStandardMaterial({
      map: tableFeltTex,
      color: 0x8ea6bf,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );
  const tableMesh = new THREE.Mesh(tableGeo, tableMat);
  tableMesh.position.y = -0.58;
  tableMesh.receiveShadow = true;
  boardGroup.add(tableMesh);

  // Soft contact shadow directly under the square board plinth
  const boardShadowGeo = track(new THREE.PlaneGeometry(26.8, 26.8));
  const boardShadowMat = track(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  const boardShadow = new THREE.Mesh(boardShadowGeo, boardShadowMat);
  boardShadow.rotation.x = -Math.PI / 2;
  boardShadow.position.y = -0.36;
  boardGroup.add(boardShadow);

  // 2. Sculpted Square Walnut Plinth Base (multi-tier stepped molding)
  const plinthLowerGeo = track(
    new RoundedBoxGeometry(23.1, 0.24, 23.1, 4, 0.14),
  );
  const plinthLower = new THREE.Mesh(plinthLowerGeo, walnutMat);
  plinthLower.position.y = -0.24;
  plinthLower.castShadow = true;
  plinthLower.receiveShadow = true;
  boardGroup.add(plinthLower);

  const plinthUpperGeo = track(
    new RoundedBoxGeometry(22.5, 0.22, 22.5, 4, 0.12),
  );
  const plinthUpper = new THREE.Mesh(plinthUpperGeo, walnutMat);
  plinthUpper.position.y = -0.07;
  plinthUpper.castShadow = true;
  plinthUpper.receiveShadow = true;
  boardGroup.add(plinthUpper);

  // Raised walnut perimeter frame lip
  const rimFrameGeo = track(createSquareRingGeometry(11.18, 10.56, 0.1, 0.18));
  const rimFrameMesh = new THREE.Mesh(rimFrameGeo, walnutMat);
  rimFrameMesh.position.y = 0.02;
  rimFrameMesh.castShadow = true;
  rimFrameMesh.receiveShadow = true;
  boardGroup.add(rimFrameMesh);

  // Recessed dark felt square deck
  const feltDeckGeo = track(new THREE.BoxGeometry(21.15, 0.04, 21.15));
  const feltDeckMesh = new THREE.Mesh(feltDeckGeo, feltMat);
  // Cara superior en y=0.06: por encima del zócalo de nogal (y=0.04) para
  // evitar z-fighting, y por debajo de las vías (y≈0.07).
  feltDeckMesh.position.y = 0.04;
  feltDeckMesh.receiveShadow = true;
  boardGroup.add(feltDeckMesh);

  // Brushed brass outer square bezel frame
  const outerBrassFrameGeo = track(
    createSquareRingGeometry(10.94, 10.82, 0.05, 0.12),
  );
  const outerBrassFrame = new THREE.Mesh(outerBrassFrameGeo, brassMat);
  outerBrassFrame.position.y = 0.08;
  outerBrassFrame.castShadow = true;
  boardGroup.add(outerBrassFrame);

  // Square Perimeter Track Bed & Inner/Outer Brass Square Rails
  const outerTrackGeo = track(createSquareRingGeometry(10.42, 8.78, 0.045, 0.06));
  const outerTrackMesh = new THREE.Mesh(outerTrackGeo, darkSlateMat);
  outerTrackMesh.position.y = 0.025;
  outerTrackMesh.receiveShadow = true;
  boardGroup.add(outerTrackMesh);

  const trackOuterBrassGeo = track(
    createSquareRingGeometry(10.44, 10.36, 0.04, 0.06),
  );
  const trackOuterBrass = new THREE.Mesh(trackOuterBrassGeo, brassMat);
  trackOuterBrass.position.y = 0.045;
  boardGroup.add(trackOuterBrass);

  const trackInnerBrassGeo = track(createSquareRingGeometry(8.84, 8.76, 0.04));
  const trackInnerBrass = new THREE.Mesh(trackInnerBrassGeo, brassMat);
  trackInnerBrass.position.y = 0.045;
  boardGroup.add(trackInnerBrass);

  // Brass corner accent studs on the outer square bezel
  const studGeo = track(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16));
  [
    [-10.88, -10.88],
    [10.88, -10.88],
    [10.88, 10.88],
    [-10.88, 10.88],
  ].forEach(([sx, sz]) => {
    const stud = new THREE.Mesh(studGeo, brassMat);
    stud.position.set(sx, 0.11, sz);
    boardGroup.add(stud);
  });

  // 3. 6 Straight Radial Spoke Bridges + Slim Brass Rails
  for (let i = 0; i < 6; i++) {
    const ep = SQUARE_SPOKE_ENDPOINTS[i];
    const bridgeLen = ep.length - 1.1;
    const midDist = (ep.length + 0.8) * 0.5;

    const spokeBedGeo = track(new THREE.BoxGeometry(bridgeLen, 0.045, 1.18));
    const spokeRailGeo = track(new THREE.BoxGeometry(bridgeLen - 0.15, 0.025, 0.045));

    const spokeBridge = new THREE.Group();
    spokeBridge.rotation.y = -ep.angle;

    const bed = new THREE.Mesh(spokeBedGeo, darkSlateMat);
    bed.position.set(midDist, 0.045, 0);
    bed.receiveShadow = true;
    spokeBridge.add(bed);

    const railA = new THREE.Mesh(spokeRailGeo, brassMat);
    railA.position.set(midDist, 0.07, 0.56);
    spokeBridge.add(railA);

    const railB = new THREE.Mesh(spokeRailGeo, brassMat);
    railB.position.set(midDist, 0.07, -0.56);
    spokeBridge.add(railB);

    boardGroup.add(spokeBridge);
  }

  // Shared beacon & highlight geometries for reachable tiles
  const beaconDiamondGeo = track(new THREE.OctahedronGeometry(0.18, 0));
  const beaconMatShared = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.beacon,
      emissive: SCENE_COLORS.beaconGlow,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.3,
    }),
  );

  // 4. Build All 79 Interactive Spaces
  const standardBoxGeo = track(new RoundedBoxGeometry(0.96, 0.1, 0.96, 3, 0.04));
  const standardFaceGeo = track(new THREE.PlaneGeometry(0.84, 0.84));
  const standardRingGeo = track(new THREE.RingGeometry(0.49, 0.59, 32));

  const hqBoxGeo = track(new RoundedBoxGeometry(1.32, 0.14, 1.32, 3, 0.05));
  const hqFaceGeo = track(new THREE.PlaneGeometry(1.16, 1.16));
  const hqRingGeo = track(new THREE.RingGeometry(0.7, 0.82, 36));

  for (const space of TRIVIAL_BOARD.spaces) {
    const tileGroup = new THREE.Group();
    tileGroup.position.set(space.position[0], 0.04, space.position[2]);

    if (space.kind === 'hub') {
      // Multi-part Central Square Brass Hub Pedestal housing 6-sector medallion
      const hubSide = (BOARD_DIMENSIONS.hubRadius + 0.16) * 2;
      const hubBaseGeo = track(
        new RoundedBoxGeometry(hubSide, 0.14, hubSide, 3, 0.08),
      );
      const hubBezelMat = track(
        new THREE.MeshStandardMaterial({
          color: SCENE_COLORS.gold,
          roughness: 0.26,
          metalness: 0.88,
        }),
      );
      const hubBase = new THREE.Mesh(hubBaseGeo, hubBezelMat);
      hubBase.position.y = 0.09;
      hubBase.castShadow = true;
      hubBase.receiveShadow = true;
      tileGroup.add(hubBase);

      const hubTopGeo = track(
        new THREE.CircleGeometry(BOARD_DIMENSIONS.hubRadius - 0.02, 64),
      );
      const hubFaceMat = track(
        new THREE.MeshPhysicalMaterial({
          map: hubTex,
          roughness: 0.38,
          metalness: 0.0,
          clearcoat: 0.35,
          clearcoatRoughness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
      );
      const hubTop = new THREE.Mesh(hubTopGeo, hubFaceMat);
      hubTop.rotation.x = -Math.PI / 2;
      hubTop.position.y = 0.182;
      hubTop.receiveShadow = true;
      hubTop.userData.spaceId = space.id;
      hubBase.userData.spaceId = space.id;
      tileGroup.add(hubTop);

      const hubHighlightGeo = track(
        new THREE.RingGeometry(
          BOARD_DIMENSIONS.hubRadius + 0.26,
          BOARD_DIMENSIONS.hubRadius + 0.42,
          48,
        ),
      );
      const highlightMat = track(
        new THREE.MeshBasicMaterial({
          color: SCENE_COLORS.validRing,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      const highlightRing = new THREE.Mesh(hubHighlightGeo, highlightMat);
      highlightRing.rotation.x = -Math.PI / 2;
      highlightRing.position.y = 0.19;
      tileGroup.add(highlightRing);

      const beaconGroup = new THREE.Group();
      beaconGroup.position.y = 0.72;
      beaconGroup.visible = false;
      const diamond = new THREE.Mesh(beaconDiamondGeo, beaconMatShared);
      beaconGroup.add(diamond);
      tileGroup.add(beaconGroup);

      boardGroup.add(tileGroup);
      clickableMeshes.push(hubTop, hubBase);

      tileVisuals.set(space.id, {
        space,
        group: tileGroup,
        hitMesh: hubTop,
        faceMesh: hubTop,
        bezelMat: hubBezelMat,
        faceMat: hubFaceMat,
        highlightRing,
        beaconGroup,
        baseY: 0.04,
      });
      continue;
    }

    const isHQ = space.kind === 'hq';
    // Orient tile radially toward center
    tileGroup.rotation.y = -space.angle;

    const bezelMat = isHQ ? hqBezelMat : tileBezelMat;

    const baseMesh = new THREE.Mesh(isHQ ? hqBoxGeo : standardBoxGeo, bezelMat);
    baseMesh.position.y = isHQ ? 0.11 : 0.07;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData.spaceId = space.id;
    tileGroup.add(baseMesh);

    const faceTex =
      space.kind === 'roll_again'
        ? rollAgainTex
        : isHQ
          ? hqTileTextures[space.category!]
          : catTileTextures[space.category!];

    const faceMat = track(
      new THREE.MeshPhysicalMaterial({
        map: faceTex,
        // Menos barniz: desde la vista cenital el reflejo lavaba los colores
        roughness: 0.38,
        metalness: 0.0,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );

    const faceMesh = new THREE.Mesh(
      isHQ ? hqFaceGeo : standardFaceGeo,
      faceMat,
    );
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = isHQ ? 0.185 : 0.125;
    faceMesh.receiveShadow = true;
    faceMesh.userData.spaceId = space.id;
    tileGroup.add(faceMesh);

    const highlightMat = track(
      new THREE.MeshBasicMaterial({
        color: SCENE_COLORS.validRing,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    const highlightRing = new THREE.Mesh(
      isHQ ? hqRingGeo : standardRingGeo,
      highlightMat,
    );
    highlightRing.rotation.x = -Math.PI / 2;
    highlightRing.position.y = isHQ ? 0.19 : 0.132;
    tileGroup.add(highlightRing);

    const beaconGroup = new THREE.Group();
    beaconGroup.position.y = isHQ ? 0.72 : 0.64;
    beaconGroup.visible = false;
    const diamond = new THREE.Mesh(beaconDiamondGeo, beaconMatShared);
    beaconGroup.add(diamond);
    tileGroup.add(beaconGroup);

    boardGroup.add(tileGroup);
    clickableMeshes.push(faceMesh, baseMesh);

    tileVisuals.set(space.id, {
      space,
      group: tileGroup,
      hitMesh: faceMesh,
      faceMesh,
      bezelMat,
      faceMat,
      highlightRing,
      beaconGroup,
      baseY: 0.04,
    });
  }

  return {
    boardGroup,
    tileVisuals,
    clickableMeshes,
    disposables,
    shared: { walnutMat, catTileTextures },
  };
}


/** Geometría extruida del símbolo, compartida por todas las fichas. */
let marchaSymbolGeometry: THREE.ExtrudeGeometry | null = null;
const MARCHA_LOGO_HEIGHT = 0.7;
const MARCHA_LOGO_DEPTH = 0.07;

function getMarchaSymbolGeometry(): THREE.ExtrudeGeometry {
  if (marchaSymbolGeometry) return marchaSymbolGeometry;
  const svg = new SVGLoader().parse(marchaSymbolSvg());
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: MARCHA_LOGO_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.6,
    bevelSegments: 2,
    curveSegments: 10,
  });
  // Unidades SVG → mundo: centrar y escalar. El eje Y del SVG crece hacia
  // abajo; se corrige girando 180° en X (un escalado negativo invertiría el
  // orden de los triángulos y las caras quedarían del revés).
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const w = bb.max.x - bb.min.x;
  const h = bb.max.y - bb.min.y;
  const scale = MARCHA_LOGO_HEIGHT / h;
  geo.translate(-(bb.min.x + w / 2), -(bb.min.y + h / 2), -MARCHA_LOGO_DEPTH / 2);
  geo.scale(scale, scale, 1);
  geo.rotateX(Math.PI);
  geo.translate(0, MARCHA_LOGO_HEIGHT / 2, 0);
  geo.computeVertexNormals();
  marchaSymbolGeometry = geo;
  return geo;
}

function relativeLuminance(hex: string): number {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
}

/**
 * Construye el símbolo de MarCha extruido en 3D con el color del jugador.
 * Los huecos del símbolo (estrella, mano y violetas) se rellenan con una
 * placa interior blanca, o azul oscuro MarCha si el color del jugador es claro,
 * para que el dibujo se lea igual que en el logo plano.
 */
export function createMarchaSymbolMesh(
  colorHex: string,
  track: <T extends { dispose: () => void }>(item: T) => T,
): THREE.Group {
  const group = new THREE.Group();
  const geo = getMarchaSymbolGeometry();
  // Material mate con algo de emisión: el símbolo conserva el color exacto
  // de la marca bajo la luz del estudio (con PBR el reflejo del entorno y el
  // tone mapping lo dejaban en tono pastel).
  const brandColor = new THREE.Color(colorHex);
  const bodyMat = track(
    new THREE.MeshLambertMaterial({
      color: brandColor.clone().multiplyScalar(0.6),
      emissive: brandColor.clone().multiplyScalar(0.45),
    }),
  );
  const logoMesh = new THREE.Mesh(geo, bodyMat);
  logoMesh.castShadow = true;
  group.add(logoMesh);

  const cutoutColor =
    relativeLuminance(colorHex) > 0.35 ? 0x312a4e : SCENE_COLORS.logoCutout;
  const plateMat = track(
    new THREE.MeshStandardMaterial({
      color: cutoutColor,
      roughness: 0.55,
      metalness: 0.0,
    }),
  );
  const plateW = MARCHA_LOGO_HEIGHT * 0.9;
  const plateGeo = track(
    new RoundedBoxGeometry(plateW, MARCHA_LOGO_HEIGHT * 0.9, MARCHA_LOGO_DEPTH * 0.5, 2, 0.04),
  );
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = MARCHA_LOGO_HEIGHT / 2;
  group.add(plate);
  return group;
}

/**
 * Creates a 10-part composite 3D Trivial Pursuit pie-holder player token
 * grounded at bottom-center (y = 0).
 */
export function createPlayerToken(
  playerId: string,
  rimHex: string,
  shadowTex: THREE.Texture,
): {
  visual: PlayerTokenVisual;
  disposables: Array<{ dispose: () => void }>;
} {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const group = new THREE.Group();
  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  // 1. Contact shadow grounded at y = 0.004
  const shadowGeo = track(new THREE.PlaneGeometry(1.15, 1.15));
  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    }),
  );
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.006;
  group.add(shadowPlane);

  // 2. Sculpted outer rim cup (LatheGeometry)
  const rimProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.42, 0),
    new THREE.Vector2(0.46, 0.06),
    new THREE.Vector2(0.46, 0.23),
    new THREE.Vector2(0.42, 0.27),
    new THREE.Vector2(0.37, 0.27),
    new THREE.Vector2(0.37, 0.08),
    new THREE.Vector2(0, 0.08),
  ];
  const rimGeo = track(new THREE.LatheGeometry(rimProfile, 36));
  const rimMat = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(rimHex),
      roughness: 0.22,
      metalness: 0.65,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    }),
  );
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.castShadow = true;
  rimMesh.receiveShadow = true;
  bodyGroup.add(rimMesh);

  // 3. Dark inner recessed tray
  const trayGeo = track(new THREE.CylinderGeometry(0.365, 0.365, 0.03, 32));
  const trayMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.tokenTray,
      roughness: 0.85,
      metalness: 0.1,
    }),
  );
  const trayMesh = new THREE.Mesh(trayGeo, trayMat);
  trayMesh.position.y = 0.085;
  bodyGroup.add(trayMesh);

  // 4. Divisores dorados entre quesitos
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.goldBright,
      roughness: 0.26,
      metalness: 0.9,
    }),
  );

  const finGeo = track(new THREE.BoxGeometry(0.28, 0.13, 0.025));
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const fin = new THREE.Mesh(finGeo, brassMat);
    fin.position.set(Math.cos(a) * 0.22, 0.16, Math.sin(a) * 0.22);
    fin.rotation.y = -a;
    bodyGroup.add(fin);
  }

  // Poste central que sostiene el símbolo de MarCha
  const postGeo = track(new THREE.CylinderGeometry(0.05, 0.075, 0.26, 16));
  const postMesh = new THREE.Mesh(postGeo, brassMat);
  postMesh.position.y = 0.21;
  postMesh.castShadow = true;
  bodyGroup.add(postMesh);

  // Símbolo de MarCha en 3D, del color del jugador. Se orienta hacia la
  // cámara en cada fotograma (ver TrivialSceneController).
  const logo = createMarchaSymbolMesh(rimHex, track);
  logo.position.y = 0.33;
  bodyGroup.add(logo);

  // 5. 6 Individual 3D Extruded Wedges ("Quesitos")
  const wedges = {} as Record<CategoryColorId, THREE.Mesh>;
  const wedgeAnimProgress = {} as Record<CategoryColorId, number>;

  const createSectorShape = () => {
    const shape = new THREE.Shape();
    const innerR = 0.095;
    const outerR = 0.345;
    const halfSpan = Math.PI / 6 - 0.055; // clean gap between fins
    shape.moveTo(Math.cos(-halfSpan) * innerR, Math.sin(-halfSpan) * innerR);
    shape.lineTo(Math.cos(-halfSpan) * outerR, Math.sin(-halfSpan) * outerR);
    shape.absarc(0, 0, outerR, -halfSpan, halfSpan, false);
    shape.lineTo(Math.cos(halfSpan) * innerR, Math.sin(halfSpan) * innerR);
    shape.absarc(0, 0, innerR, halfSpan, -halfSpan, true);
    shape.closePath();
    return shape;
  };

  const wedgeGeo = track(
    new THREE.ExtrudeGeometry(createSectorShape(), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.014,
      bevelSegments: 2,
      curveSegments: 16,
    }),
  );
  wedgeGeo.rotateX(-Math.PI / 2);

  for (let i = 0; i < 6; i++) {
    const catId = CATEGORY_ORDER[i];
    const cat = CATEGORIES[catId];
    const wMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(cat.hex),
        roughness: 0.18,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
      }),
    );
    const wMesh = new THREE.Mesh(wedgeGeo, wMat);
    wMesh.position.y = 0.11;
    wMesh.rotation.y = -(i * Math.PI) / 3 - Math.PI / 6;
    wMesh.visible = false;
    wMesh.castShadow = true;
    bodyGroup.add(wMesh);

    wedges[catId] = wMesh;
    wedgeAnimProgress[catId] = 0;
  }

  return {
    visual: {
      playerId,
      group,
      bodyGroup,
      wedges,
      wedgeAnimProgress,
      shadowPlane,
      logoGroup: logo,
    },
    disposables,
  };
}

/**
 * Creates a composite 3D physical die with rounded bevels and recessed colored pips.
 * Local face normals mapping when unrotated:
 * +Y = 1, -Y = 6, +Z = 2, -Z = 5, +X = 3, -X = 4
 */
export function createDieMesh(): {
  dieGroup: THREE.Group;
  disposables: Array<{ dispose: () => void }>;
} {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const dieGroup = new THREE.Group();
  const size = 0.86;
  const half = size / 2;

  const bodyGeo = track(new RoundedBoxGeometry(size, size, size, 4, 0.11));
  const bodyMat = track(
    new THREE.MeshPhysicalMaterial({
      color: SCENE_COLORS.dieBody,
      roughness: 0.18,
      metalness: 0.04,
      clearcoat: 0.92,
      clearcoatRoughness: 0.1,
    }),
  );
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  dieGroup.add(bodyMesh);

  const pipGeo = track(new THREE.SphereGeometry(0.068, 16, 12));
  const darkPipMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.diePip,
      roughness: 0.35,
      metalness: 0.2,
    }),
  );
  const crimsonPipMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.dieOnePip,
      roughness: 0.3,
      metalness: 0.15,
    }),
  );

  const d = 0.2;
  const addPip = (x: number, y: number, z: number, mat: THREE.Material) => {
    const pip = new THREE.Mesh(pipGeo, mat);
    pip.position.set(x, y, z);
    pip.scale.set(
      Math.abs(x) > 0.35 ? 0.35 : 1,
      Math.abs(y) > 0.35 ? 0.35 : 1,
      Math.abs(z) > 0.35 ? 0.35 : 1,
    );
    dieGroup.add(pip);
  };

  // +Y: 1 (center crimson pip)
  addPip(0, half, 0, crimsonPipMat);

  // -Y: 6
  [
    [-d, -d],
    [-d, 0],
    [-d, d],
    [d, -d],
    [d, 0],
    [d, d],
  ].forEach(([px, pz]) => addPip(px, -half, pz, darkPipMat));

  // +Z: 2
  [
    [-d, d],
    [d, -d],
  ].forEach(([px, py]) => addPip(px, py, half, darkPipMat));

  // -Z: 5
  [
    [-d, d],
    [d, d],
    [0, 0],
    [-d, -d],
    [d, -d],
  ].forEach(([px, py]) => addPip(px, py, -half, darkPipMat));

  // +X: 3
  [
    [-d, d],
    [0, 0],
    [d, -d],
  ].forEach(([py, pz]) => addPip(half, py, pz, darkPipMat));

  // -X: 4
  [
    [-d, d],
    [d, d],
    [-d, -d],
    [d, -d],
  ].forEach(([py, pz]) => addPip(-half, py, pz, darkPipMat));

  return { dieGroup, disposables };
}

/**
 * Returns the target Euler rotation so that face `value` (1..6) points straight up (+Y).
 */
export function getDieTargetEuler(value: number): THREE.Euler {
  switch (value) {
    case 1:
      return new THREE.Euler(0, 0, 0);
    case 2:
      return new THREE.Euler(-Math.PI / 2, 0, 0);
    case 3:
      return new THREE.Euler(0, 0, Math.PI / 2);
    case 4:
      return new THREE.Euler(0, 0, -Math.PI / 2);
    case 5:
      return new THREE.Euler(Math.PI / 2, 0, 0);
    case 6:
    default:
      return new THREE.Euler(Math.PI, 0, 0);
  }
}

/**
 * Creates a tabletop walnut & brass card caddy beside the board holding the 6
 * unnamed color category card decks.
 */
export function createCardCaddy(shared: {
  walnutMat: THREE.MeshStandardMaterial;
  catTileTextures: Record<CategoryColorId, THREE.CanvasTexture>;
}): {
  visual: CardCaddyVisual;
  disposables: Array<{ dispose: () => void }>;
} {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const group = new THREE.Group();
  // Madera y texturas de cartas se reutilizan del tablero (sin duplicar canvas)
  const walnutMat = shared.walnutMat;
  const brassMat = track(
    new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.gold,
      roughness: 0.26,
      metalness: 0.88,
    }),
  );

  // Walnut tray base grounded on tabletop (local y = 0)
  const baseGeo = track(new RoundedBoxGeometry(3.2, 0.24, 6.8, 3, 0.04));
  const baseMesh = new THREE.Mesh(baseGeo, walnutMat);
  baseMesh.position.y = 0.12;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Brass corner trim rails
  const railGeo = track(new THREE.BoxGeometry(0.06, 0.3, 6.6));
  const railL = new THREE.Mesh(railGeo, brassMat);
  railL.position.set(-1.56, 0.16, 0);
  group.add(railL);
  const railR = new THREE.Mesh(railGeo, brassMat);
  railR.position.set(1.56, 0.16, 0);
  group.add(railR);

  const stackGeo = track(new RoundedBoxGeometry(1.18, 0.42, 1.72, 2, 0.03));
  const topCardGeo = track(new THREE.PlaneGeometry(1.06, 1.56));

  const topCards = {} as Record<CategoryColorId, THREE.Mesh>;
  const baseY = {} as Record<CategoryColorId, number>;

  CATEGORY_ORDER.forEach((catId, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = col === 0 ? -0.72 : 0.72;
    const cz = (row - 1) * 2.05;

    const cat = CATEGORIES[catId];
    const stackMat = track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(cat.darkHex),
        roughness: 0.55,
        metalness: 0.05,
      }),
    );
    const stack = new THREE.Mesh(stackGeo, stackMat);
    stack.position.set(cx, 0.45, cz);
    stack.castShadow = true;
    stack.receiveShadow = true;
    group.add(stack);

    const cardTex = shared.catTileTextures[catId];
    const cardMat = track(
      new THREE.MeshPhysicalMaterial({
        map: cardTex,
        roughness: 0.24,
        metalness: 0.04,
        clearcoat: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    );
    const topCard = new THREE.Mesh(topCardGeo, cardMat);
    topCard.rotation.x = -Math.PI / 2;
    const ty = 0.665;
    topCard.position.set(cx, ty, cz);
    topCard.castShadow = true;
    group.add(topCard);

    topCards[catId] = topCard;
    baseY[catId] = ty;
  });

  return {
    visual: { group, topCards, baseY },
    disposables,
  };
}
