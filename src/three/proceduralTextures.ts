import * as THREE from 'three';
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
  for (let i = 0; i < 4500; i++) {
    const x = (i * 73) % size;
    const y = (i * 137) % size;
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
  const cat = CATEGORIES[categoryId];
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rich radial enamel gradient
  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.44,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.72,
  );
  grad.addColorStop(0, cat.lightHex);
  grad.addColorStop(0.55, cat.hex);
  grad.addColorStop(1, cat.darkHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Fine inset gold/ivory frame
  ctx.strokeStyle = isHQ
    ? 'rgba(253, 230, 138, 0.92)'
    : 'rgba(255, 255, 255, 0.42)';
  ctx.lineWidth = isHQ ? 16 : 10;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  if (isHQ) {
    // Wedge medallion silhouette behind emblem to mark HQ spaces unmistakably
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.85)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Inner wedge triangle motif
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2 - size * 0.28);
    ctx.lineTo(size / 2 + size * 0.25, size / 2 + size * 0.19);
    ctx.lineTo(size / 2 - size * 0.25, size / 2 + size * 0.19);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Geometric emblem in crisp ivory
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  drawEmblemPath(ctx, cat.emblem, size / 2, size / 2, isHQ ? 92 : 105);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.fill();
  ctx.restore();

  if (cat.emblem === 'hex') {
    // Hollow inner hex ring for sharper read
    ctx.save();
    drawEmblemPath(ctx, 'hex', size / 2, size / 2, isHQ ? 42 : 48);
    ctx.fillStyle = cat.hex;
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRollAgainTileTexture(
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm ivory enamel background
  const grad = ctx.createRadialGradient(
    size / 2,
    size * 0.45,
    30,
    size / 2,
    size / 2,
    size * 0.7,
  );
  grad.addColorStop(0, '#fcfaf2');
  grad.addColorStop(1, '#dfd6c2');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#b08d57';
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  // Circular re-roll arrows around a crisp die icon
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Curved arrows
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  const arcR = 134;
  ctx.beginPath();
  ctx.arc(0, 0, arcR, -Math.PI * 0.82, Math.PI * 0.08);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, arcR, Math.PI * 0.18, Math.PI * 1.08);
  ctx.stroke();

  // Arrowheads
  const drawHead = (angle: number) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(arcR + 22, -4);
    ctx.lineTo(arcR - 20, -4);
    ctx.lineTo(arcR, 28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawHead(Math.PI * 0.08);
  drawHead(Math.PI * 1.08);

  // Center stylized die square with 5 pips
  ctx.fillStyle = '#0f172a';
  const dSize = 112;
  const r = 20;
  ctx.beginPath();
  ctx.roundRect(-dSize / 2, -dSize / 2, dSize, dSize, r);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  const pipOffsets = [
    [-28, -28],
    [28, -28],
    [0, 0],
    [-28, 28],
    [28, 28],
  ];
  pipOffsets.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

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

  ctx.fillStyle = '#181c24';
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
    ctx.strokeStyle = '#e5c17b';
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
  ctx.strokeStyle = '#e5c17b';
  ctx.lineWidth = 18;
  ctx.stroke();

  // Inner ivory compass center
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#f8f5ec';
  ctx.fill();
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Subtle geometric star in center
  drawEmblemPath(ctx, 'compass', cx, cy, innerR * 0.62);
  ctx.fillStyle = '#1e293b';
  ctx.fill();

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
