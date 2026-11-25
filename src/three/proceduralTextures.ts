import * as THREE from 'three';
import { CANVAS_COLORS } from '../theme/palette';
import { MARCHA_SYMBOL_PATHS, MARCHA_SYMBOL_VIEWBOX } from '../brand/marchaSymbol';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  SQUARE_SPOKE_ENDPOINTS,
} from '../game/boardTopology';
import type { CategoryColorId, EmblemKind } from '../game/types';

function drawEmblemPath(
  ctx: CanvasRenderingContext2D,
  kind: EmblemKind,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  switch (kind) {
    case 'compass': {
      // 4-point compass star
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.34;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'diamond': {
      // Faceted gem diamond
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.85, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r * 0.85, cy);
      ctx.closePath();
      break;
    }
    case 'star': {
      // 5-point crisp star
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.44;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'hex': {
      // Regular hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const x = cx + Math.cos(angle) * r * 0.92;
        const y = cy + Math.sin(angle) * r * 0.92;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case 'leaf': {
      // Stylized botanical leaf
      ctx.moveTo(cx, cy - r);
      ctx.quadraticCurveTo(cx + r * 0.95, cy - r * 0.1, cx, cy + r);
      ctx.quadraticCurveTo(cx - r * 0.95, cy - r * 0.1, cx, cy - r);
      ctx.closePath();
      break;
    }
    case 'flame': {
      // Stylized geometric drop/flame
      ctx.moveTo(cx, cy - r);
      ctx.bezierCurveTo(
        cx + r * 0.95,
        cy - r * 0.05,
        cx + r * 0.78,
        cy + r * 0.85,
        cx,
        cy + r * 0.92,
      );
      ctx.bezierCurveTo(
        cx - r * 0.78,
        cy + r * 0.85,
        cx - r * 0.95,
        cy - r * 0.05,
        cx,
        cy - r,
      );
      ctx.closePath();
      break;
    }
  }
}

export function createWalnutWoodTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2d1a10';
  ctx.fillRect(0, 0, size, size);

  // Subtle wood grain waves
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin(y * 0.04) * 10 + Math.cos(y * 0.015) * 6;
    const tone = Math.sin((y + wave) * 0.12) * 0.5 + 0.5;
    const r = Math.round(38 + tone * 26);
    const g = Math.round(21 + tone * 14);
    const b = Math.round(13 + tone * 9);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y, size, 2);
  }

  // Fine dark grain pores
  ctx.strokeStyle = 'rgba(14, 7, 3, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const y = (i * 19.7) % size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      size * 0.33,
      y + Math.sin(i) * 8,
      size * 0.66,
      y - Math.cos(i) * 8,
      size,
      y,
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFeltTexture(
  baseHex: string,
  maxAnisotropy: number,
  repeat = 4,
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle micro-weave noise
  // Ruido pseudoaleatorio determinista (LCG). El patrón lineal anterior
  // (i*73, i*137) generaba rayas diagonales visibles en el fieltro.
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 4500; i++) {
    const x = Math.floor(rand() * size);
    const y = Math.floor(rand() * size);
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 2, 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCategoryTileTexture(
  categoryId: CategoryColorId,
  isHQ: boolean,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  // Mismo diseño que el tablero imprimible: color plano, filete blanco y
  // emblema blanco; las sedes llevan un medallón oscuro con el quesito.
  const cat = CATEGORIES[categoryId];
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.fillStyle = cat.hex;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(30, 30, size - 60, size - 60, 26);
  ctx.stroke();

  if (isHQ) {
    const r = size * 0.37;
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.fillStyle = cat.darkHex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.stroke();
    // Quesito
    const wy = c + r * 0.37;
    const wr = r * 0.96;
    ctx.beginPath();
    ctx.moveTo(c, wy);
    ctx.arc(c, wy, wr, -Math.PI / 2 - Math.PI / 6, -Math.PI / 2 + Math.PI / 6);
    ctx.closePath();
    ctx.fillStyle = cat.lightHex;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.stroke();
    drawEmblemPath(ctx, cat.emblem, c, c - r * 0.1, r * 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill('evenodd');
    if (cat.emblem === 'hex') {
      drawEmblemPath(ctx, 'hex', c, c - r * 0.1, r * 0.14);
      ctx.fillStyle = cat.lightHex;
      ctx.fill();
    }
  } else {
    drawEmblemPath(ctx, cat.emblem, c, c, 105);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (cat.emblem === 'hex') {
      drawEmblemPath(ctx, 'hex', c, c, 50);
      ctx.fillStyle = cat.hex;
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRollAgainTileTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  // Igual que en el tablero imprimible: marfil con filete dorado y dos dados
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = CANVAS_COLORS.ivoryLight;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = CANVAS_COLORS.gold;
  ctx.lineWidth = 20;
  ctx.strokeRect(10, 10, size - 20, size - 20);

  const die = (cx: number, cy: number, rot: number, pips: [number, number][], first?: boolean) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const d = 190;
    ctx.beginPath();
    ctx.roundRect(-d / 2, -d / 2, d, d, 34);
    ctx.fillStyle = CANVAS_COLORS.navy;
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = CANVAS_COLORS.ivoryLight;
    ctx.stroke();
    pips.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px * 52, py * 52, 18, 0, Math.PI * 2);
      ctx.fillStyle = first ? '#d37d00' : CANVAS_COLORS.ivoryLight;
      ctx.fill();
    });
    ctx.restore();
  };
  die(size * 0.4, size * 0.38, -0.21, [[0, 0]], true);
  die(size * 0.6, size * 0.62, 0.24, [[-1, -1], [0, 0], [1, 1]]);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHubMedallionTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = CANVAS_COLORS.navyDeep;
  ctx.fillRect(0, 0, size, size);

  // 6 colored sectors aligned to each square-board spoke angle
  const outerR = size * 0.44;
  const innerR = size * 0.13;

  const unwrapAngleDiff = (a: number, b: number) => {
    let diff = b - a;
    while (diff <= -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return diff;
  };

  for (let i = 0; i < 6; i++) {
    const cat = CATEGORIES[CATEGORY_ORDER[i]];
    const midAngle = SQUARE_SPOKE_ENDPOINTS[i].angle;
    const prevAngle = SQUARE_SPOKE_ENDPOINTS[(i + 5) % 6].angle;
    const nextAngle = SQUARE_SPOKE_ENDPOINTS[(i + 1) % 6].angle;

    const startAngle = midAngle - unwrapAngleDiff(prevAngle, midAngle) * 0.5;
    const endAngle = midAngle + unwrapAngleDiff(midAngle, nextAngle) * 0.5;

    const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
    grad.addColorStop(0, cat.darkHex);
    grad.addColorStop(0.65, cat.hex);
    grad.addColorStop(1, cat.lightHex);

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Gold separator lines
    ctx.strokeStyle = CANVAS_COLORS.gold;
    ctx.lineWidth = 10;
    ctx.stroke();

    // Small emblem in each sector
    const embR = (innerR + outerR) * 0.53;
    const ex = cx + Math.cos(midAngle) * embR;
    const ey = cy + Math.sin(midAngle) * embR;
    ctx.save();
    drawEmblemPath(ctx, cat.emblem, ex, ey, 42);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    ctx.restore();
  }

  // Outer brass ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.strokeStyle = CANVAS_COLORS.gold;
  ctx.lineWidth = 18;
  ctx.stroke();

  // Centro azul oscuro con el símbolo MarCha en blanco, como en el imprimible
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = CANVAS_COLORS.navy;
  ctx.fill();
  ctx.strokeStyle = CANVAS_COLORS.gold;
  ctx.lineWidth = 12;
  ctx.stroke();

  const [vx, vy, vw, vh] = MARCHA_SYMBOL_VIEWBOX.split(' ').map(Number);
  const symH = innerR * 1.25;
  const k = symH / vh;
  ctx.save();
  ctx.translate(cx - (vw * k) / 2, cy - symH / 2);
  ctx.scale(k, k);
  ctx.translate(-vx, -vy);
  ctx.fillStyle = '#ffffff';
  MARCHA_SYMBOL_PATHS.forEach((d) => ctx.fill(new Path2D(d), 'evenodd'));
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.5,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.32)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
