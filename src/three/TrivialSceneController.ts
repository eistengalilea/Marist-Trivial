import * as THREE from 'three';
import { SCENE_COLORS } from '../theme/palette';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CATEGORY_ORDER, TRIVIAL_BOARD } from '../game/boardTopology';
import type {
  CameraPreset,
  CategoryColorId,
  HighlightFilter,
  PlayerState,
} from '../game/types';
import {
  buildBoardAssembly,
  createCardCaddy,
  createDieMesh,
  createPlayerToken,
  getDieTargetEuler,
  getSpaceSurfaceY,
  type CardCaddyVisual,
  type PlayerTokenVisual,
  type TileVisual,
} from './boardModels';
import {
  createContactShadowTexture,
  createFeltTexture,
} from './proceduralTextures';

// Pre-allocated math helpers for zero-GC tick loop
const _quatA = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();
const _eulerA = new THREE.Euler();

export interface SceneCallbacks {
  onSpaceClick: (spaceId: string) => void;
  onSpaceHover: (spaceId: string | null) => void;
  onHopStep: (stepIndex: number) => void;
  onDieSettled: (value: number) => void;
  onMoveComplete: () => void;
  onContextLostChange?: (lost: boolean) => void;
}

interface ActiveMoveAnim {
  playerId: string;
  path: string[];
  stepIndex: number;
  stepProgress: number;
  stepDuration: number;
  lastPlayedStep: number;
}

interface ActiveDieAnim {
  value: number;
  elapsed: number;
  duration: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  spinEuler: THREE.Euler;
  targetQuat: THREE.Quaternion;
  settled: boolean;
}

export class TrivialSceneController {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private orthoCamera: THREE.OrthographicCamera;
  private activeCamera: THREE.Camera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();

  private tileVisuals = new Map<string, TileVisual>();
  private clickableMeshes: THREE.Mesh[] = [];
  private tokenVisuals = new Map<string, PlayerTokenVisual>();
  private tokenTargets = new Map<string, THREE.Vector3>();
  private dieGroup!: THREE.Group;
  private dieShadow!: THREE.Mesh;
  private cardCaddy!: CardCaddyVisual;
  private shadowTexture!: THREE.Texture;
  private disposables: Array<{ dispose: () => void }> = [];
  private tokenDisposables: Array<{ dispose: () => void }> = [];

  private validDestIds = new Set<string>();
  private hoveredSpaceId: string | null = null;
  /** Casilla resaltada desde la interfaz (chips de destino del panel). */
  private previewSpaceId: string | null = null;
  private highlightFilter: HighlightFilter = 'none';
  private activeChallengeCategory: CategoryColorId | null = null;

  private activeMove: ActiveMoveAnim | null = null;
  private activeDie: ActiveDieAnim | null = null;

  private cameraPreset: CameraPreset = 'overview';
  private cameraTransitionActive = false;
  private desiredCamPos = new THREE.Vector3(0, 17.5, 17.2);
  private desiredCamTarget = new THREE.Vector3(0, 0, 0.4);
  private followPlayerId: string | null = null;

  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private lastHoverRaycast = 0;
  private pointerDownPos = { x: 0, y: 0 };

  private diceTrayPos = new THREE.Vector3(-14.2, -0.35, 0);

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2),
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE_COLORS.night);
    this.scene.fog = new THREE.FogExp2(SCENE_COLORS.night, 0.012);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 160);
    this.camera.position.copy(this.desiredCamPos);

    const aspect = width / height;
    const orthoHalfH = 13.8;
    this.orthoCamera = new THREE.OrthographicCamera(
      -orthoHalfH * aspect,
      orthoHalfH * aspect,
      orthoHalfH,
      -orthoHalfH,
      0.1,
      120,
    );
    this.orthoCamera.position.set(0, 32, 0.001);
    this.orthoCamera.lookAt(0, 0, 0);
    this.activeCamera = this.camera;

    // Studio Environment Reflection (mandatory on all devices)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    const envTex = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Lighting
    const hemiLight = new THREE.HemisphereLight(
      SCENE_COLORS.hemiSky,
      SCENE_COLORS.hemiGround,
      0.9,
    );
    this.scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(SCENE_COLORS.keyLight, 2.2);
    keyLight.position.set(11, 20, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 55;
    const d = 17;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(SCENE_COLORS.rimLight, 1.0);
    rimLight.position.set(-14, 10, -13);
    this.scene.add(rimLight);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 8.5;
    this.controls.maxDistance = 36;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.12;
    this.controls.target.copy(this.desiredCamTarget);
    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();

    // Build 3D Board Assembly
    const board = buildBoardAssembly(maxAniso);
    this.scene.add(board.boardGroup);
    this.tileVisuals = board.tileVisuals;
    this.clickableMeshes = board.clickableMeshes;
    this.disposables.push(...board.disposables);

    this.shadowTexture = createContactShadowTexture();
    this.disposables.push(this.shadowTexture);

    // Build Walnut & Felt Dice Tray on left side of board
    this.buildDiceTray(maxAniso, board.shared.walnutMat);

    // Build Physical 3D Die
    const die = createDieMesh();
    this.dieGroup = die.dieGroup;
    this.disposables.push(...die.disposables);
    this.dieGroup.position.set(
      this.diceTrayPos.x,
      this.diceTrayPos.y + 0.52,
      this.diceTrayPos.z,
    );
    this.scene.add(this.dieGroup);

    const dieShadowGeo = new THREE.PlaneGeometry(1.45, 1.45);
    const dieShadowMat = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    this.disposables.push(dieShadowGeo, dieShadowMat);
    this.dieShadow = new THREE.Mesh(dieShadowGeo, dieShadowMat);
    this.dieShadow.rotation.x = -Math.PI / 2;
    this.dieShadow.position.set(
      this.diceTrayPos.x,
      this.diceTrayPos.y + 0.095,
      this.diceTrayPos.z,
    );
    this.scene.add(this.dieShadow);

    // Build 3D Card Caddy on right side of square board
    const caddy = createCardCaddy(board.shared);
    this.cardCaddy = caddy.visual;
    this.disposables.push(...caddy.disposables);
    this.cardCaddy.group.position.set(14.5, -0.38, 0);
    this.cardCaddy.group.rotation.y = -0.15;
    this.scene.add(this.cardCaddy.group);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  private buildDiceTray(
    maxAnisotropy: number,
    walnutMat: THREE.MeshStandardMaterial,
  ) {
    const trayGroup = new THREE.Group();
    trayGroup.position.copy(this.diceTrayPos);

    const feltTex = createFeltTexture(SCENE_COLORS.deckFelt, maxAnisotropy, 3);
    const feltMat = new THREE.MeshStandardMaterial({
      map: feltTex,
      roughness: 0.92,
      metalness: 0.0,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: SCENE_COLORS.gold,
      roughness: 0.25,
      metalness: 0.9,
    });

    const outerGeo = new RoundedBoxGeometry(3.4, 0.34, 3.8, 3, 0.06);
    const outerMesh = new THREE.Mesh(outerGeo, walnutMat);
    outerMesh.position.y = 0.14;
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    trayGroup.add(outerMesh);

    const padGeo = new RoundedBoxGeometry(2.85, 0.08, 3.25, 2, 0.02);
    const padMesh = new THREE.Mesh(padGeo, feltMat);
    padMesh.position.y = 0.29;
    padMesh.receiveShadow = true;
    trayGroup.add(padMesh);

    // Rim lip walls
    const wallLongGeo = new THREE.BoxGeometry(0.18, 0.22, 3.5);
    const wallShortGeo = new THREE.BoxGeometry(3.15, 0.22, 0.18);
    const w1 = new THREE.Mesh(wallLongGeo, walnutMat);
    w1.position.set(-1.54, 0.38, 0);
    w1.castShadow = true;
    const w2 = new THREE.Mesh(wallLongGeo, walnutMat);
    w2.position.set(1.54, 0.38, 0);
    w2.castShadow = true;
    const w3 = new THREE.Mesh(wallShortGeo, walnutMat);
    w3.position.set(0, 0.38, -1.72);
    w3.castShadow = true;
    const w4 = new THREE.Mesh(wallShortGeo, walnutMat);
    w4.position.set(0, 0.38, 1.72);
    w4.castShadow = true;
    trayGroup.add(w1, w2, w3, w4);

    // Brass corner brackets
    const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12);
    [
      [-1.54, -1.72],
      [1.54, -1.72],
      [-1.54, 1.72],
      [1.54, 1.72],
    ].forEach(([px, pz]) => {
      const pin = new THREE.Mesh(pinGeo, brassMat);
      pin.position.set(px, 0.39, pz);
      trayGroup.add(pin);
    });

    this.scene.add(trayGroup);
    this.disposables.push(
      feltTex,
      feltMat,
      brassMat,
      outerGeo,
      padGeo,
      wallLongGeo,
      wallShortGeo,
      pinGeo,
    );
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('webglcontextlost', this.handleContextLost);
    canvas.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLostChange?.(true);
  };

  private handleContextRestored = () => {
    this.callbacks.onContextLostChange?.(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    const orthoHalfH = 13.8;
    this.orthoCamera.left = -orthoHalfH * aspect;
    this.orthoCamera.right = orthoHalfH * aspect;
    this.orthoCamera.top = orthoHalfH;
    this.orthoCamera.bottom = -orthoHalfH;
    this.orthoCamera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  };

  private updatePointerNdc(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - this.lastHoverRaycast < 45) return;
    this.lastHoverRaycast = now;

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.activeCamera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);

    const hitId =
      hits.length > 0 ? (hits[0].object.userData.spaceId as string) : null;

    if (hitId !== this.hoveredSpaceId) {
      this.hoveredSpaceId = hitId;
      this.callbacks.onSpaceHover(hitId);
    }

    if (hitId && this.validDestIds.has(hitId)) {
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'grab';
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    if (Math.hypot(dx, dy) > 6) return; // Dragged camera, not a click

    this.updatePointerNdc(e);
    this.raycaster.setFromCamera(this.pointerNdc, this.activeCamera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
    if (hits.length > 0) {
      const spaceId = hits[0].object.userData.spaceId as string;
      if (spaceId) {
        this.callbacks.onSpaceClick(spaceId);
      }
    }
  };

  public syncPlayers(players: PlayerState[], activePlayerId: string) {
    this.followPlayerId = activePlayerId;

    // Rebuild tokens if player roster changed
    const currentIds = new Set(players.map((p) => p.id));
    const existingIds = new Set(this.tokenVisuals.keys());
    const rosterChanged =
      currentIds.size !== existingIds.size ||
      players.some((p) => !existingIds.has(p.id));

    if (rosterChanged) {
      this.tokenVisuals.forEach((tv) => {
        this.scene.remove(tv.group);
      });
      this.tokenVisuals.clear();
      this.tokenTargets.clear();
      this.tokenDisposables.forEach((d) => d.dispose());
      this.tokenDisposables = [];

      for (const player of players) {
        const created = createPlayerToken(
          player.id,
          player.rimHex,
          this.shadowTexture,
        );
        this.tokenVisuals.set(player.id, created.visual);
        this.tokenDisposables.push(...created.disposables);
        const pos = this.computeTokenWorldPos(player.id, player.spaceId, players);
        created.visual.group.position.copy(pos);
        this.tokenTargets.set(player.id, pos.clone());
        this.scene.add(created.visual.group);
      }
    }

    // Update wedge visibility & target positions
    for (const player of players) {
      const tv = this.tokenVisuals.get(player.id);
      if (!tv) continue;

      for (const catId of CATEGORY_ORDER) {
        const hasWedge = player.wedges[catId];
        const wMesh = tv.wedges[catId];
        if (hasWedge && !wMesh.visible) {
          wMesh.visible = true;
          tv.wedgeAnimProgress[catId] = 0; // Start drop-in animation
        } else if (!hasWedge) {
          wMesh.visible = false;
          tv.wedgeAnimProgress[catId] = 0;
        }
      }

      if (!this.activeMove || this.activeMove.playerId !== player.id) {
        const targetPos = this.computeTokenWorldPos(
          player.id,
          player.spaceId,
          players,
        );
        this.tokenTargets.set(player.id, targetPos);
      }
    }
  }

  private computeTokenWorldPos(
    playerId: string,
    spaceId: string,
    players: PlayerState[],
  ): THREE.Vector3 {
    const space = TRIVIAL_BOARD.spaceMap.get(spaceId);
    if (!space) return new THREE.Vector3(0, 0.22, 0);

    const occupants = players.filter((p) => p.spaceId === spaceId);
    const idx = Math.max(
      0,
      occupants.findIndex((p) => p.id === playerId),
    );
    const count = occupants.length;
    const baseY = getSpaceSurfaceY(space);

    if (count <= 1) {
      return new THREE.Vector3(space.position[0], baseY, space.position[2]);
    }

    const spreadRadius = space.kind === 'hub' ? 0.84 : 0.32;
    const angle = (idx / count) * Math.PI * 2 + Math.PI / 6;
    return new THREE.Vector3(
      space.position[0] + Math.cos(angle) * spreadRadius,
      baseY,
      space.position[2] + Math.sin(angle) * spreadRadius,
    );
  }

  public setValidDestinations(spaceIds: string[]) {
    this.validDestIds = new Set(spaceIds);
    this.tileVisuals.forEach((tv, id) => {
      const isValid = this.validDestIds.has(id);
      tv.beaconGroup.visible = isValid;
    });
  }

  /** Resalta una casilla como si tuviera el puntero encima (desde la UI). */
  public setPreviewSpace(spaceId: string | null) {
    this.previewSpaceId = spaceId;
  }

  public setHighlightFilter(filter: HighlightFilter) {
    this.highlightFilter = filter;
  }

  public setActiveChallengeCategory(cat: CategoryColorId | null) {
    this.activeChallengeCategory = cat;
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraPreset = preset;

    if (preset === '2d') {
      this.activeCamera = this.orthoCamera;
      this.orthoCamera.position.set(0, 32, 0.001);
      this.orthoCamera.zoom = 1;
      this.orthoCamera.updateProjectionMatrix();
      this.controls.object = this.orthoCamera;
      this.controls.target.set(0, 0, 0);
      this.controls.enableRotate = false;
      this.controls.minPolarAngle = 0;
      this.controls.minZoom = 0.65;
      this.controls.maxZoom = 3.2;
      this.cameraTransitionActive = false;
      this.controls.update();
      return;
    }

    // Restore 3D Perspective Camera
    this.activeCamera = this.camera;
    this.controls.object = this.camera;
    this.controls.enableRotate = true;
    this.controls.minPolarAngle = 0.08;
    this.cameraTransitionActive = true;

    if (preset === 'overview') {
      this.desiredCamPos.set(0, 17.5, 17.2);
      this.desiredCamTarget.set(0, 0, 0.4);
    } else if (preset === 'top') {
      this.desiredCamPos.set(0, 25.5, 0.15);
      this.desiredCamTarget.set(0, 0, 0);
    } else if (preset === 'follow' && this.followPlayerId) {
      const tv = this.tokenVisuals.get(this.followPlayerId);
      if (tv) {
        const p = tv.group.position;
        this.desiredCamTarget.set(p.x, p.y + 0.2, p.z);
        this.desiredCamPos.set(p.x * 0.72, 9.2, p.z * 0.72 + 8.5);
      }
    }
  }

  public rollDie(value: number) {
    const targetEuler = getDieTargetEuler(value);
    const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
    const endX = this.diceTrayPos.x + (Math.random() - 0.5) * 0.9;
    const endZ = this.diceTrayPos.z + (Math.random() - 0.5) * 1.1;
    const restY = this.diceTrayPos.y + 0.33 + 0.43;

    this.activeDie = {
      value,
      elapsed: 0,
      duration: 1.05,
      startPos: new THREE.Vector3(
        this.diceTrayPos.x,
        this.diceTrayPos.y + 3.4,
        this.diceTrayPos.z - 0.8,
      ),
      endPos: new THREE.Vector3(endX, restY, endZ),
      spinEuler: new THREE.Euler(
        Math.PI * 4.5,
        Math.PI * 3.2,
        Math.PI * 2.7,
      ),
      targetQuat,
      settled: false,
    };
  }

  public animateTokenMove(playerId: string, path: string[]) {
    if (path.length < 2) {
      this.callbacks.onMoveComplete();
      return;
    }
    this.activeMove = {
      playerId,
      path,
      stepIndex: 0,
      stepProgress: 0,
      stepDuration: 0.24,
      lastPlayedStep: -1,
    };
  }

  private matchesHighlightFilter(spaceId: string): boolean {
    if (this.highlightFilter === 'none') return false;
    const space = TRIVIAL_BOARD.spaceMap.get(spaceId);
    if (!space) return false;
    switch (this.highlightFilter) {
      case 'hub':
        return space.kind === 'hub';
      case 'all_hq':
        return space.kind === 'hq';
      case 'all_roll_again':
        return space.kind === 'roll_again';
      case 'all_spokes':
        return space.kind === 'spoke';
      case 'all_ring':
        return space.kind === 'ring';
      default:
        return space.category === this.highlightFilter;
    }
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.elapsedTime;

      this.updateCamera(dt);
      this.updateDieAnimation(dt);
      this.updateMoveAnimation(dt);
      this.updateTokenWedgesAndPositions(dt, elapsed);
      this.updateTiles(dt, elapsed);
      this.updateCardCaddy(dt, elapsed);

      this.controls.update();
      this.renderer.render(this.scene, this.activeCamera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateCamera(dt: number) {
    if (
      this.cameraPreset === 'follow' &&
      this.followPlayerId &&
      this.cameraTransitionActive
    ) {
      const tv = this.tokenVisuals.get(this.followPlayerId);
      if (tv) {
        const p = tv.group.position;
        this.desiredCamTarget.set(p.x, p.y + 0.2, p.z);
        this.desiredCamPos.set(p.x * 0.72, 9.2, p.z * 0.72 + 8.5);
      }
    }

    if (this.cameraTransitionActive) {
      const lambda = 6.5;
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        this.desiredCamPos.x,
        lambda,
        dt,
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        this.desiredCamPos.y,
        lambda,
        dt,
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        this.desiredCamPos.z,
        lambda,
        dt,
      );
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        this.desiredCamTarget.x,
        lambda,
        dt,
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        this.desiredCamTarget.y,
        lambda,
        dt,
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        this.desiredCamTarget.z,
        lambda,
        dt,
      );

      if (
        this.cameraPreset !== 'follow' &&
        this.camera.position.distanceTo(this.desiredCamPos) < 0.04 &&
        this.controls.target.distanceTo(this.desiredCamTarget) < 0.04
      ) {
        this.cameraTransitionActive = false;
      }
    }
  }

  private updateDieAnimation(dt: number) {
    if (!this.activeDie) return;
    const anim = this.activeDie;
    anim.elapsed += dt;
    const t = Math.min(1, anim.elapsed / anim.duration);

    // Smooth ease-out horizontal travel
    const horizT = 1 - Math.pow(1 - t, 3);
    const x = THREE.MathUtils.lerp(anim.startPos.x, anim.endPos.x, horizT);
    const z = THREE.MathUtils.lerp(anim.startPos.z, anim.endPos.z, horizT);

    // Physical gravity drop + 2 damped bounces
    let y: number;
    if (t < 0.48) {
      const fallT = t / 0.48;
      y = THREE.MathUtils.lerp(anim.startPos.y, anim.endPos.y, fallT * fallT);
    } else if (t < 0.78) {
      const b1 = (t - 0.48) / 0.3;
      y = anim.endPos.y + Math.sin(b1 * Math.PI) * 0.72;
    } else {
      const b2 = (t - 0.78) / 0.22;
      y = anim.endPos.y + Math.sin(b2 * Math.PI) * 0.24;
    }

    this.dieGroup.position.set(x, y, z);
    this.dieShadow.position.set(x, this.diceTrayPos.y + 0.335, z);
    const heightAboveTray = Math.max(0, y - anim.endPos.y);
    const shadowScale = Math.max(0.55, 1 - heightAboveTray * 0.14);
    this.dieShadow.scale.setScalar(shadowScale);

    // Spin rapidly during fall, then slerp cleanly to exact target face
    if (t < 0.75) {
      const spinFade = 1 - t / 0.75;
      _eulerA.set(
        anim.spinEuler.x * t,
        anim.spinEuler.y * t,
        anim.spinEuler.z * t,
      );
      _quatA.setFromEuler(_eulerA);
      _quatB.copy(anim.targetQuat);
      this.dieGroup.quaternion.copy(_quatA).slerp(_quatB, 1 - spinFade * 0.85);
    } else {
      const settleT = (t - 0.75) / 0.25;
      this.dieGroup.quaternion.slerp(anim.targetQuat, settleT);
    }

    if (t >= 1 && !anim.settled) {
      anim.settled = true;
      this.dieGroup.position.copy(anim.endPos);
      this.dieGroup.quaternion.copy(anim.targetQuat);
      this.activeDie = null;
      this.callbacks.onDieSettled(anim.value);
    }
  }

  private updateMoveAnimation(dt: number) {
    if (!this.activeMove) return;
    const move = this.activeMove;
    const tv = this.tokenVisuals.get(move.playerId);
    if (!tv) {
      this.activeMove = null;
      this.callbacks.onMoveComplete();
      return;
    }

    if (move.lastPlayedStep !== move.stepIndex) {
      move.lastPlayedStep = move.stepIndex;
      this.callbacks.onHopStep(move.stepIndex);
    }

    move.stepProgress += dt / move.stepDuration;
    const t = Math.min(1, move.stepProgress);

    const fromSpace = TRIVIAL_BOARD.spaceMap.get(move.path[move.stepIndex]);
    const toSpace = TRIVIAL_BOARD.spaceMap.get(move.path[move.stepIndex + 1]);

    if (fromSpace && toSpace) {
      const fromY = getSpaceSurfaceY(fromSpace);
      const toY = getSpaceSurfaceY(toSpace);
      const x = THREE.MathUtils.lerp(
        fromSpace.position[0],
        toSpace.position[0],
        t,
      );
      const z = THREE.MathUtils.lerp(
        fromSpace.position[2],
        toSpace.position[2],
        t,
      );
      const arc = Math.sin(t * Math.PI) * 0.72;
      const y = THREE.MathUtils.lerp(fromY, toY, t) + arc;

      tv.group.position.set(x, y, z);
      tv.shadowPlane.position.y = 0.006 - arc;
      tv.shadowPlane.scale.setScalar(Math.max(0.55, 1 - arc * 0.45));

      // Subtle squash/stretch during hop
      const stretch = 1 + Math.sin(t * Math.PI) * 0.14;
      tv.bodyGroup.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
    }

    if (t >= 1) {
      move.stepIndex += 1;
      move.stepProgress = 0;

      if (move.stepIndex >= move.path.length - 1) {
        tv.bodyGroup.scale.set(1, 1, 1);
        tv.shadowPlane.position.y = 0.006;
        tv.shadowPlane.scale.setScalar(1);
        this.activeMove = null;
        this.callbacks.onMoveComplete();
      }
    }
  }

  private updateTokenWedgesAndPositions(dt: number, elapsed: number) {
    this.tokenVisuals.forEach((tv, playerId) => {
      // Smoothly settle idle tokens to sub-tile formation positions
      if (!this.activeMove || this.activeMove.playerId !== playerId) {
        const target = this.tokenTargets.get(playerId);
        if (target) {
          tv.group.position.x = THREE.MathUtils.damp(
            tv.group.position.x,
            target.x,
            10,
            dt,
          );
          tv.group.position.y = THREE.MathUtils.damp(
            tv.group.position.y,
            target.y,
            10,
            dt,
          );
          tv.group.position.z = THREE.MathUtils.damp(
            tv.group.position.z,
            target.z,
            10,
            dt,
          );
        }

        // Subtle active player breathing elevation
        if (playerId === this.followPlayerId) {
          tv.bodyGroup.position.y = Math.max(0, Math.sin(elapsed * 2.8) * 0.025);
        } else {
          tv.bodyGroup.position.y = THREE.MathUtils.damp(
            tv.bodyGroup.position.y,
            0,
            8,
            dt,
          );
        }
      }

      // Drop-in animation for newly earned wedges
      for (const catId of CATEGORY_ORDER) {
        const wMesh = tv.wedges[catId];
        if (!wMesh.visible) continue;
        if (tv.wedgeAnimProgress[catId] < 1) {
          tv.wedgeAnimProgress[catId] = Math.min(
            1,
            tv.wedgeAnimProgress[catId] + dt * 2.2,
          );
          const p = tv.wedgeAnimProgress[catId];
          // Ease out back bounce
          const c1 = 1.70158;
          const c3 = c1 + 1;
          const eased = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
          wMesh.position.y = THREE.MathUtils.lerp(0.85, 0.11, eased);
        } else {
          wMesh.position.y = 0.11;
        }
      }
    });
  }

  private updateTiles(dt: number, elapsed: number) {
    const hasFilter = this.highlightFilter !== 'none';

    this.tileVisuals.forEach((tv, id) => {
      const isValidDest = this.validDestIds.has(id);
      const isHovered =
        this.hoveredSpaceId === id || this.previewSpaceId === id;
      const isRuleMatched = this.matchesHighlightFilter(id);

      // Float & rotate reachable beacons
      if (tv.beaconGroup.visible) {
        const baseBeaconY = tv.space.kind === 'hq' || tv.space.kind === 'hub' ? 0.72 : 0.62;
        tv.beaconGroup.position.y =
          baseBeaconY + Math.sin(elapsed * 4 + tv.space.angle) * 0.11;
        tv.beaconGroup.rotation.y = elapsed * 2.2;
      }

      // Highlight ring opacity & lift
      const ringMat = tv.highlightRing.material as THREE.MeshBasicMaterial;
      let targetOpacity = 0;
      let targetTileY = tv.baseY;

      if (isValidDest) {
        targetOpacity = isHovered ? 0.98 : 0.62 + Math.sin(elapsed * 5) * 0.2;
        ringMat.color.setHex(
          isHovered ? SCENE_COLORS.validRingHover : SCENE_COLORS.validRing,
        );
        targetTileY = isHovered ? tv.baseY + 0.08 : tv.baseY + 0.035;
      } else if (hasFilter) {
        if (isRuleMatched) {
          targetOpacity = 0.88;
          ringMat.color.setHex(SCENE_COLORS.filterRing);
          targetTileY = tv.baseY + 0.06;
        } else {
          targetOpacity = 0;
          targetTileY = tv.baseY;
        }
      }

      ringMat.opacity = THREE.MathUtils.damp(ringMat.opacity, targetOpacity, 10, dt);
      tv.group.position.y = THREE.MathUtils.damp(
        tv.group.position.y,
        targetTileY,
        10,
        dt,
      );

      // Subtle dimming for non-matching tiles when inspecting a rule category
      const targetColorScalar =
        hasFilter && !isRuleMatched && !isValidDest ? 0.35 : 1.0;
      const scalar = THREE.MathUtils.damp(
        tv.faceMat.color.r,
        targetColorScalar,
        8,
        dt,
      );
      tv.faceMat.color.setRGB(scalar, scalar, scalar);
    });
  }

  private updateCardCaddy(dt: number, elapsed: number) {
    for (const catId of CATEGORY_ORDER) {
      const card = this.cardCaddy.topCards[catId];
      const baseY = this.cardCaddy.baseY[catId];
      const isDrawn = this.activeChallengeCategory === catId;
      const targetY = isDrawn ? baseY + 0.42 + Math.sin(elapsed * 3) * 0.04 : baseY;
      const targetRotX = isDrawn ? -Math.PI / 2 + 0.22 : -Math.PI / 2;

      card.position.y = THREE.MathUtils.damp(card.position.y, targetY, 8, dt);
      card.rotation.x = THREE.MathUtils.damp(card.rotation.x, targetRotX, 8, dt);
    }
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    canvas.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );

    this.controls.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.tokenDisposables.forEach((d) => d.dispose());
    this.renderer.dispose();

    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
