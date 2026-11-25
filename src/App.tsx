import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Printer,
  ChevronDown,
  ChevronUp,
  Dices,
  Languages,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  DIFFICULTY_CONFIGS,
  MATCH_LENGTH_CONFIGS,
  TRIVIAL_BOARD,
  countPlayerWedges,
  createEmptyCategoryProgress,
  createEmptyWedges,
  findValidMoves,
  shortestGraphDistance,
} from './game/boardTopology';
import { createQuestionDecks, drawQuestionFromDeck } from './game/questions';
import { soundFX } from './game/soundEffects';
import type {
  ActiveChallenge,
  CameraPreset,
  CategoryColorId,
  DifficultyLevel,
  GamePhase,
  HighlightFilter,
  MatchLength,
  PlayerConfig,
  PlayerState,
} from './game/types';
import { TrivialSceneController } from './three/TrivialSceneController';
import { WedgeWheelSvg } from './components/CategoryEmblemSvg';
import { RulesAnalysisModal } from './components/RulesAnalysisModal';
import { PrintablesModal } from './components/PrintablesModal';
import { ChallengeModal } from './components/ChallengeModal';
import { SetupModal } from './components/SetupModal';
import { PlayerProgressModal } from './components/PlayerProgressModal';
import { MarchaSymbol } from './components/MarchaSymbol';
import { spaceLabel, useI18n } from './i18n/I18nContext';
import { LANGS, MESSAGES } from './i18n/messages';
import type { Messages } from './i18n/messages';

/** Mensaje de estado guardado como función: se vuelve a pintar al cambiar de idioma. */
type StatusText = (m: Messages) => string;

/** Nombres por defecto («Jugador 1», «Jogador 1», «Xogador 1»…) que se traducen solos. */
const DEFAULT_NAME_SOURCE = `(?:${Object.values(MESSAGES)
  .map((msgs) => msgs.defaultPlayer(0).replace(/ 0$/, ''))
  .join('|')}) (\\d)`;
const DEFAULT_NAME_RE = new RegExp(`^${DEFAULT_NAME_SOURCE}$`);
const DEFAULT_NAME_IN_TEXT_RE = new RegExp(`\\b${DEFAULT_NAME_SOURCE}\\b`, 'g');

const defaultPlayers = (m: Messages): PlayerConfig[] => [
  { id: 'p1', name: m.defaultPlayer(1), rimHex: '#fbf8f3', isCpu: false },
  { id: 'p2', name: m.defaultPlayer(2), rimHex: '#d5a53c', isCpu: true },
];

const HUB_SWATCH = `conic-gradient(${CATEGORY_ORDER.map(
  (c, i) => `${CATEGORIES[c].hex} ${i * 60}deg ${(i + 1) * 60}deg`,
).join(', ')})`;

function buildInitialPlayers(configs: PlayerConfig[]): PlayerState[] {
  return configs.map((c) => ({
    ...c,
    spaceId: 'hub',
    wedges: createEmptyWedges(),
    categoryProgress: createEmptyCategoryProgress(),
  }));
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<TrivialSceneController | null>(null);
  const { lang, setLang, m } = useI18n();
  /** Mazos barajados de la partida en curso: cada pregunta sale una sola vez. */
  const questionDecksRef = useRef(createQuestionDecks());

  const [players, setPlayers] = useState<PlayerState[]>(() =>
    buildInitialPlayers(defaultPlayers(m)),
  );
  const [activePlayerIdx, setActivePlayerIdx] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<Map<string, string[]>>(
    () => new Map(),
  );
  const [pendingDestId, setPendingDestId] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] =
    useState<ActiveChallenge | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [matchLength, setMatchLength] = useState<MatchLength>('medium');
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(
    null,
  );
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [highlightFilter, setHighlightFilter] =
    useState<HighlightFilter>('none');
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);
  const [printablesOpen, setPrintablesOpen] = useState<boolean>(false);
  const [setupOpen, setSetupOpen] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<StatusText>(
    () => (msgs: Messages) => msgs.status.initial,
  );
  /** Guarda el mensaje de estado (como función del idioma). */
  const say = useCallback((text: StatusText) => setStatusText(() => text), []);

  // Al cambiar de idioma, los nombres por defecto de los jugadores también cambian.
  useEffect(() => {
    setPlayers((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const match = DEFAULT_NAME_RE.exec(p.name);
        const name = match ? m.defaultPlayer(Number(match[1])) : p.name;
        if (name === p.name) return p;
        changed = true;
        return { ...p, name };
      });
      return changed ? next : prev;
    });
  }, [m]);

  const activePlayer = players[activePlayerIdx] ?? players[0];

  // Mutable ref bridge for Three.js callbacks so canvas is never recreated
  const stateRef = useRef({
    players,
    activePlayerIdx,
    phase,
    validMoves,
    pendingDestId,
    activeChallenge,
    difficulty,
    matchLength,
  });
  stateRef.current = {
    players,
    activePlayerIdx,
    phase,
    validMoves,
    pendingDestId,
    activeChallenge,
    difficulty,
    matchLength,
  };

  /** Saca la siguiente pregunta del mazo barajado de esa categoría. */
  const drawQuestion = useCallback(
    (catId: CategoryColorId) =>
      drawQuestionFromDeck(
        questionDecksRef.current,
        catId,
        stateRef.current.difficulty,
      ),
    [],
  );

  const advanceTurn = useCallback((prefix?: StatusText) => {
    // Se calcula fuera del actualizador de estado: los actualizadores deben
    // ser puros (React puede ejecutarlos dos veces en modo estricto).
    const { players: curPlayers, activePlayerIdx: curIdx } = stateRef.current;
    const next = (curIdx + 1) % curPlayers.length;
    const nextPlayer = curPlayers[next];
    setActivePlayerIdx(next);
    say((msgs) =>
      prefix
        ? msgs.status.thenTurn(prefix(msgs), nextPlayer.name)
        : msgs.status.turn(nextPlayer.name),
    );
    setDiceValue(null);
    setValidMoves(new Map());
    setPendingDestId(null);
    setActiveChallenge(null);
    setPhase('idle');
  }, []);

  const chooseMovePath = useCallback((destId: string) => {
    const { players: curPlayers, activePlayerIdx: curIdx, validMoves: moves } =
      stateRef.current;
    const player = curPlayers[curIdx];
    const path = moves.get(destId);
    if (!player || !path) return;

    setValidMoves(new Map());
    setPendingDestId(destId);
    setPhase('moving');
    sceneRef.current?.setValidDestinations([]);
    sceneRef.current?.animateTokenMove(player.id, path);

    const destSpace = TRIVIAL_BOARD.spaceMap.get(destId);
    if (destSpace) {
      say((msgs) => msgs.status.movesTo(player.name, spaceLabel(destSpace, msgs)));
    }
  }, []);

  const handleSpaceArrival = useCallback(() => {
    const {
      players: curPlayers,
      activePlayerIdx: curIdx,
      pendingDestId: destId,
    } = stateRef.current;
    const player = curPlayers[curIdx];
    if (!player || !destId) return;

    const updatedPlayers = curPlayers.map((p, idx) =>
      idx === curIdx ? { ...p, spaceId: destId } : p,
    );
    setPlayers(updatedPlayers);

    const space = TRIVIAL_BOARD.spaceMap.get(destId);
    if (!space) return;

    // 1. Roll Again space
    if (space.kind === 'roll_again') {
      soundFX.playSuccess();
      setDiceValue(null);
      setPendingDestId(null);
      setPhase('idle');
      say((msgs) => msgs.status.rollAgain(player.name));
      return;
    }

    const wedgeCount = countPlayerWedges(player.wedges);

    // 2. Central Hub arrival
    if (space.kind === 'hub') {
      if (wedgeCount === 6) {
        const randomCat =
          CATEGORY_ORDER[Math.floor(Math.random() * CATEGORY_ORDER.length)];
        const q = drawQuestion(randomCat);
        setPhase('final_challenge');
        setActiveChallenge({
          playerId: player.id,
          spaceId: space.id,
          kind: 'final',
          category: randomCat,
          needsCategoryChoice: false,
          question: q,
          selectedOptionIndex: null,
          isRevealed: false,
        });
        say((msgs) =>
          msgs.status.finalArrived(player.name, msgs.categories[randomCat].name),
        );
      } else {
        setPhase('challenge');
        setActiveChallenge({
          playerId: player.id,
          spaceId: space.id,
          kind: 'hub_choice',
          category: null,
          needsCategoryChoice: true,
          question: null,
          selectedOptionIndex: null,
          isRevealed: false,
        });
        say((msgs) => msgs.status.landedHub(player.name));
      }
      return;
    }

    // 3. Standard or HQ colored space
    if (space.category) {
      const q = drawQuestion(space.category);
      setPhase('challenge');
      setActiveChallenge({
        playerId: player.id,
        spaceId: space.id,
        kind: space.kind === 'hq' ? 'hq' : 'standard',
        category: space.category,
        needsCategoryChoice: false,
        question: q,
        selectedOptionIndex: null,
        isRevealed: false,
      });
      say((msgs) => msgs.status.landedOn(player.name, spaceLabel(space, msgs)));
    }
  }, [drawQuestion]);

  const handleDieSettled = useCallback((value: number) => {
    const { players: curPlayers, activePlayerIdx: curIdx } = stateRef.current;
    const player = curPlayers[curIdx];
    if (!player) return;

    const moves = findValidMoves(player.spaceId, value);
    setValidMoves(moves);
    setPhase('choosing_move');
    const destIds = Array.from(moves.keys());
    sceneRef.current?.setValidDestinations(destIds);
    say((msgs) => msgs.status.rolled(player.name, value, destIds.length));
  }, []);

  // Initialize Three.js Scene once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const controller = new TrivialSceneController(mountEl, {
      onSpaceClick: (spaceId) => {
        const {
          phase: curPhase,
          validMoves: moves,
          players: curPlayers,
          activePlayerIdx: curIdx,
        } = stateRef.current;
        const player = curPlayers[curIdx];
        if (
          curPhase === 'choosing_move' &&
          player &&
          !player.isCpu &&
          moves.has(spaceId)
        ) {
          soundFX.playUiClick();
          chooseMovePath(spaceId);
        }
      },
      onSpaceHover: (spaceId) => {
        setHoveredSpaceId(spaceId);
      },
      onHopStep: (stepIdx) => {
        soundFX.playTileHop(stepIdx);
      },
      onDieSettled: (val) => {
        handleDieSettled(val);
      },
      onMoveComplete: () => {
        handleSpaceArrival();
      },
      onContextLostChange: (lost) => {
        setContextLost(lost);
      },
    });

    sceneRef.current = controller;

    return () => {
      controller.dispose();
      sceneRef.current = null;
    };
  }, [chooseMovePath, handleDieSettled, handleSpaceArrival]);

  // Sync players, wedges, and active challenge card to 3D scene
  useEffect(() => {
    if (!sceneRef.current || !activePlayer) return;
    sceneRef.current.syncPlayers(players, activePlayer.id);
  }, [players, activePlayer]);

  useEffect(() => {
    sceneRef.current?.setHighlightFilter(highlightFilter);
  }, [highlightFilter]);

  useEffect(() => {
    sceneRef.current?.setActiveChallengeCategory(
      activeChallenge?.category ?? null,
    );
  }, [activeChallenge]);

  const triggerRoll = useCallback(() => {
    if (phase !== 'idle' || !activePlayer) return;
    const rolled = Math.floor(Math.random() * 6) + 1;
    setDiceValue(rolled);
    setPhase('rolling');
    const rollerName = activePlayer.name;
    say((msgs) => msgs.status.rolling(rollerName));
    soundFX.playDiceRoll();
    sceneRef.current?.rollDie(rolled);
  }, [phase, activePlayer]);

  const handleSelectHubCategory = useCallback((catId: CategoryColorId) => {
    soundFX.playUiClick();
    const q = drawQuestion(catId);
    setActiveChallenge((prev) =>
      prev
        ? {
            ...prev,
            category: catId,
            needsCategoryChoice: false,
            question: q,
            selectedOptionIndex: null,
            isRevealed: false,
          }
        : null,
    );
  }, [drawQuestion]);

  const handleSelectAnswer = useCallback((optionIndex: number) => {
    const ch = stateRef.current.activeChallenge;
    if (!ch || !ch.question || ch.isRevealed) return;

    const isCorrect = optionIndex === ch.question.correctIndex;
    const currentPlayer = stateRef.current.players.find(
      (p) => p.id === ch.playerId,
    );
    const lengthCfg = MATCH_LENGTH_CONFIGS[stateRef.current.matchLength];
    const currentProgress =
      ch.category && currentPlayer
        ? currentPlayer.categoryProgress[ch.category] ?? 0
        : 0;
    const earnsNewWedge =
      isCorrect &&
      ch.kind !== 'final' &&
      ch.category !== null &&
      currentPlayer !== undefined &&
      !currentPlayer.wedges[ch.category] &&
      currentProgress + 1 >= lengthCfg.questionsPerWedge;

    if (isCorrect) {
      if (ch.kind === 'final') {
        soundFX.playVictoryFanfare();
      } else if (earnsNewWedge) {
        soundFX.playWedgeEarned();
      } else {
        soundFX.playSuccess();
      }
    } else {
      soundFX.playTurnFail();
    }

    setActiveChallenge((prev) =>
      prev
        ? {
            ...prev,
            selectedOptionIndex: optionIndex,
            isRevealed: true,
          }
        : null,
    );
  }, []);

  const handleConfirmOutcome = useCallback(() => {
    const ch = stateRef.current.activeChallenge;
    if (!ch || !ch.question || !ch.isRevealed) return;
    const { playerId, kind, category, selectedOptionIndex, question } = ch;
    const success = selectedOptionIndex === question.correctIndex;

    if (!success) {
      advanceTurn((msgs) => msgs.status.wrong);
      return;
    }

    if (kind === 'final') {
      setWinnerId(playerId);
      setActiveChallenge(null);
      setPhase('won');
      const winPlayer = stateRef.current.players.find((p) => p.id === playerId);
      say((msgs) => msgs.status.won(winPlayer?.name ?? '—'));
      return;
    }

    const currentPlayer = stateRef.current.players.find(
      (p) => p.id === playerId,
    );
    const lengthCfg = MATCH_LENGTH_CONFIGS[stateRef.current.matchLength];
    const required = lengthCfg.questionsPerWedge;
    const prevProgress =
      category && currentPlayer
        ? currentPlayer.categoryProgress[category] ?? 0
        : 0;
    const nextProgress = Math.min(required, prevProgress + 1);
    const earnedNewWedge =
      category !== null &&
      currentPlayer !== undefined &&
      !currentPlayer.wedges[category] &&
      nextProgress >= required;

    if (category && currentPlayer && !currentPlayer.wedges[category]) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          const updatedProgress = Math.min(
            required,
            (p.categoryProgress[category] ?? 0) + 1,
          );
          const completed = updatedProgress >= required;
          return {
            ...p,
            categoryProgress: {
              ...p.categoryProgress,
              [category]: updatedProgress,
            },
            wedges: completed
              ? { ...p.wedges, [category]: true }
              : p.wedges,
          };
        }),
      );
    }

    if (earnedNewWedge && category) {
      say((msgs) =>
        msgs.status.wedgeDone(msgs.categories[category].short, currentPlayer?.name ?? ''),
      );
    } else if (category && currentPlayer && !currentPlayer.wedges[category]) {
      const remaining = Math.max(0, required - nextProgress);
      const name = currentPlayer.name;
      say((msgs) =>
        msgs.status.progress(
          name,
          nextProgress,
          required,
          msgs.categories[category].short,
          msgs.remaining(remaining),
        ),
      );
    } else {
      say((msgs) => msgs.status.correctKeep(currentPlayer?.name ?? ''));
    }

    setActiveChallenge(null);
    setDiceValue(null);
    setPendingDestId(null);
    setPhase('idle');
  }, [advanceTurn]);

  // CPU Autonomous Turn Choreography
  useEffect(() => {
    if (!activePlayer || !activePlayer.isCpu) return;
    if (rulesOpen || printablesOpen || setupOpen || inspectedPlayerId !== null) return;

    if (phase === 'idle') {
      const t = window.setTimeout(() => triggerRoll(), 700);
      return () => clearTimeout(t);
    }

    if (phase === 'choosing_move' && validMoves.size > 0) {
      const t = window.setTimeout(() => {
        const destIds = Array.from(validMoves.keys());
        const wedgeCount = countPlayerWedges(activePlayer.wedges);
        let bestDest = destIds[0];
        let bestScore = -Infinity;

        for (const id of destIds) {
          const sp = TRIVIAL_BOARD.spaceMap.get(id);
          if (!sp) continue;
          let score = 0;

          if (wedgeCount === 6) {
            if (sp.id === 'hub') score += 500;
            else score -= shortestGraphDistance(id, 'hub') * 12;
          } else {
            if (sp.kind === 'hq' && sp.category && !activePlayer.wedges[sp.category]) {
              score += 180;
            }
            if (sp.kind === 'roll_again') {
              score += 75;
            }
            let minDist = 99;
            for (let i = 0; i < 6; i++) {
              const cat = CATEGORY_ORDER[i];
              if (!activePlayer.wedges[cat]) {
                minDist = Math.min(minDist, shortestGraphDistance(id, `hq_${i}`));
              }
            }
            score -= minDist * 6;
          }

          score += Math.random() * 4;
          if (score > bestScore) {
            bestScore = score;
            bestDest = id;
          }
        }

        chooseMovePath(bestDest);
      }, 750);
      return () => clearTimeout(t);
    }

    if (
      (phase === 'challenge' || phase === 'final_challenge') &&
      activeChallenge
    ) {
      // Step 1: Pick category if hub choice
      if (activeChallenge.needsCategoryChoice && !activeChallenge.category) {
        const t = window.setTimeout(() => {
          const pick =
            CATEGORY_ORDER[Math.floor(Math.random() * CATEGORY_ORDER.length)];
          handleSelectHubCategory(pick);
        }, 800);
        return () => clearTimeout(t);
      }

      // Step 2: Visible question -> CPU picks an option & flips card
      if (activeChallenge.question && !activeChallenge.isRevealed) {
        const q = activeChallenge.question;
        const cpuAcc = DIFFICULTY_CONFIGS[difficulty].cpuAccuracy;
        const t = window.setTimeout(() => {
          const getsItRight = Math.random() < cpuAcc;
          let chosenIdx = q.correctIndex as number;
          if (!getsItRight) {
            const wrongIndices = [0, 1, 2, 3].filter((i) => i !== q.correctIndex);
            chosenIdx =
              wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
          }
          handleSelectAnswer(chosenIdx);
        }, 1350);
        return () => clearTimeout(t);
      }

      // Step 3: Card flipped showing answer -> pause so everyone reads it, then advance rules
      if (activeChallenge.isRevealed) {
        const t = window.setTimeout(() => {
          handleConfirmOutcome();
        }, 2100);
        return () => clearTimeout(t);
      }
    }
  }, [
    activePlayer,
    phase,
    validMoves,
    activeChallenge,
    difficulty,
    rulesOpen,
    printablesOpen,
    setupOpen,
    inspectedPlayerId,
    triggerRoll,
    chooseMovePath,
    handleSelectHubCategory,
    handleSelectAnswer,
    handleConfirmOutcome,
  ]);

  const handleStartNewGame = (
    configs: PlayerConfig[],
    nextDifficulty: DifficultyLevel,
    nextMatchLength: MatchLength,
  ) => {
    soundFX.playUiClick();
    questionDecksRef.current = createQuestionDecks();
    const fresh = buildInitialPlayers(configs);
    setDifficulty(nextDifficulty);
    setMatchLength(nextMatchLength);
    setPlayers(fresh);
    setActivePlayerIdx(0);
    setPhase('idle');
    setDiceValue(null);
    setValidMoves(new Map());
    setPendingDestId(null);
    setActiveChallenge(null);
    setWinnerId(null);
    setInspectedPlayerId(null);
    setSetupOpen(false);
    sceneRef.current?.setValidDestinations([]);
    say((msgs) =>
      msgs.status.newGame(
        msgs.length[nextMatchLength].label,
        msgs.difficulty[nextDifficulty].label,
        fresh[0].name,
      ),
    );
  };

  const handleCameraPreset = (preset: CameraPreset) => {
    soundFX.playUiClick();
    setCameraPreset(preset);
    sceneRef.current?.setCameraPreset(preset);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    soundFX.enabled = next;
    setSoundEnabled(next);
    if (next) soundFX.playUiClick();
  };

  const hoveredSpace = useMemo(
    () => (hoveredSpaceId ? TRIVIAL_BOARD.spaceMap.get(hoveredSpaceId) ?? null : null),
    [hoveredSpaceId],
  );

  const winnerPlayer = useMemo(
    () => (winnerId ? players.find((p) => p.id === winnerId) ?? null : null),
    [winnerId, players],
  );

  const canHumanRoll =
    phase === 'idle' &&
    activePlayer &&
    !activePlayer.isCpu &&
    !rulesOpen &&
    !printablesOpen &&
    !setupOpen &&
    inspectedPlayerId === null;

  const isHumanChoosing =
    phase === 'choosing_move' && !!activePlayer && !activePlayer.isCpu;

  // Destinos alcanzables ordenados (para los chips del panel y atajos 1-9)
  const destinationOptions = useMemo(
    () =>
      Array.from(validMoves.keys())
        .map((id) => TRIVIAL_BOARD.spaceMap.get(id))
        .filter((sp): sp is NonNullable<typeof sp> => !!sp),
    [validMoves],
  );

  useEffect(() => {
    if (validMoves.size === 0) sceneRef.current?.setPreviewSpace(null);
  }, [validMoves]);

  // Atajos de teclado. Se guarda el último manejador en un ref para registrar
  // el listener una sola vez y leer siempre el estado actual.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandlerRef.current = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey
    ) {
      return;
    }
    const key = e.key.toLowerCase();
    if (key === 'h') {
      setDockCollapsed((prev) => !prev);
      return;
    }
    if (rulesOpen || printablesOpen || setupOpen || inspectedPlayerId !== null) return;

    const ch = activeChallenge;
    const humanTurn = !!activePlayer && !activePlayer.isCpu;

    // Tirar el dado: Espacio o Intro
    if ((key === ' ' || key === 'enter') && canHumanRoll) {
      e.preventDefault();
      triggerRoll();
      return;
    }

    // Elegir destino: teclas 1-9
    if (isHumanChoosing && /^[1-9]$/.test(key)) {
      const dest = destinationOptions[Number(key) - 1];
      if (dest) {
        e.preventDefault();
        soundFX.playUiClick();
        chooseMovePath(dest.id);
      }
      return;
    }

    if (!ch || !humanTurn) return;

    // Elegir color en la Casilla Central: 1-6
    if (ch.needsCategoryChoice && !ch.category && /^[1-6]$/.test(key)) {
      e.preventDefault();
      handleSelectHubCategory(CATEGORY_ORDER[Number(key) - 1]);
      return;
    }

    // Responder: A-D o 1-4
    if (ch.question && !ch.isRevealed) {
      const idx = 'abcd'.indexOf(key) >= 0 ? 'abcd'.indexOf(key) : '1234'.indexOf(key);
      if (key.length === 1 && idx >= 0) {
        e.preventDefault();
        handleSelectAnswer(idx);
      }
      return;
    }

    // Continuar tras ver la respuesta: Intro o Espacio
    if (ch.isRevealed && (key === 'enter' || key === ' ')) {
      e.preventDefault();
      handleConfirmOutcome();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-night">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night p-6 text-center">
          <div className="max-w-sm p-6 rounded-xl bg-panel border border-white/12">
            <h2 className="text-lg font-semibold text-white mb-2">
              {m.contextLost.title}
            </h2>
            <p className="text-sm text-ink-400 mb-4">
              {m.contextLost.body}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-gold-400 text-ink-950 text-sm font-semibold"
            >
              {m.contextLost.reload}
            </button>
          </div>
        </div>
      )}

      {/* Top-Left Minimal Brand & Clickable Player Progress Strip */}
      <header className="fixed top-4 left-4 z-10 pointer-events-none max-w-[calc(100vw-290px)]">
        <div className="pointer-events-auto inline-flex flex-col gap-2.5 bg-panel/94 border border-white/10 rounded-xl px-4 py-3 shadow-lg">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white whitespace-nowrap">
              <MarchaSymbol fill="#ffffff" className="w-6 h-6" />
              Marist Trivial
            </h1>
            <span className="text-xs text-ink-400 whitespace-nowrap">
              {m.header.matchInfo(m.length[matchLength].label, m.difficulty[difficulty].label)}
            </span>
          </div>

          <div className="flex items-center gap-x-2 gap-y-2 flex-wrap pt-1.5 border-t border-white/8">
            {players.map((p, idx) => {
              const isActive = idx === activePlayerIdx && phase !== 'won';
              const wedgesDone = countPlayerWedges(p.wedges);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    soundFX.playUiClick();
                    setInspectedPlayerId(p.id);
                  }}
                  title={m.header.playerTitle}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg border-b-2 transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'border-gold-400 bg-white/8 text-white hover:bg-white/12'
                      : 'border-transparent text-ink-300 hover:bg-white/6 hover:text-white'
                  }`}
                >
                  <WedgeWheelSvg
                    wedges={p.wedges}
                    rimHex={p.rimHex}
                    size={28}
                  />
                  <div className="leading-tight">
                    <div className="text-xs font-medium whitespace-nowrap">
                      {p.name}
                      {p.isCpu ? ' · CPU' : ''}
                    </div>
                    <div className="text-[11px] font-mono-tabular text-ink-400">
                      {m.wedgesCount(wedgesDone)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Top-Right Compact Action Pair */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <div
          className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-panel/94 border border-white/12 shadow-lg"
          role="group"
          aria-label={m.languageLabel}
          title={m.languageLabel}
        >
          <Languages className="w-3.5 h-3.5 text-gold-400 mr-0.5" />
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              lang={l.htmlLang}
              onClick={() => {
                soundFX.playUiClick();
                setLang(l.id);
              }}
              aria-pressed={lang === l.id}
              title={l.label}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                lang === l.id
                  ? 'bg-gold-400 text-ink-950'
                  : 'text-ink-300 hover:text-white hover:bg-white/8'
              }`}
            >
              {l.short}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            soundFX.playUiClick();
            setRulesOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel/94 border border-white/12 hover:border-gold-400/50 text-xs font-medium text-ink-100 transition-colors whitespace-nowrap shadow-lg"
        >
          <BookOpen className="w-3.5 h-3.5 text-gold-400" />
          <span>{m.header.rules}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playUiClick();
            setPrintablesOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel/94 border border-white/12 hover:border-gold-400/50 text-xs font-medium text-ink-100 transition-colors whitespace-nowrap shadow-lg"
        >
          <Printer className="w-3.5 h-3.5 text-gold-400" />
          <span>{m.header.printables}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playUiClick();
            setSetupOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-panel/94 border border-white/12 hover:border-white/30 text-xs font-medium text-ink-100 transition-colors whitespace-nowrap shadow-lg"
        >
          <RotateCcw className="w-3.5 h-3.5 text-ink-300" />
          <span>{m.header.newGame}</span>
        </button>
      </div>

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(920px,94vw)] transition-transform duration-200 ease-out ${
          dockCollapsed ? 'translate-y-[calc(100%+16px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Handle attached to top edge of dock */}
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-panel/94 border border-b-0 border-white/12 text-[11px] font-medium text-ink-300 hover:text-white transition-colors whitespace-nowrap"
            title={m.dock.shortcutH}
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-gold-400" />
                <span>{m.dock.show}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
                <span>{m.dock.hide}</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-panel/95 border border-white/12 rounded-xl px-4 py-3 shadow-2xl flex flex-col gap-2.5">
          {/* Status & Hover Inspection Line */}
          <div className="flex items-center justify-between gap-4 text-xs border-b border-white/8 pb-2">
            <div className="text-ink-200 truncate">
              {statusText(m).replace(DEFAULT_NAME_IN_TEXT_RE, (_, n: string) =>
                m.defaultPlayer(Number(n)),
              )}
            </div>
            <div className="text-ink-400 shrink-0 whitespace-nowrap font-medium">
              {hoveredSpace
                ? spaceLabel(hoveredSpace, m)
                : highlightFilter !== 'none'
                  ? m.dock.filterActive
                  : isHumanChoosing
                      ? m.dock.pickHint
                      : cameraPreset === '2d'
                        ? m.dock.view2dHint
                        : m.dock.defaultHint}
            </div>
          </div>

          {/* Primary Controls Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Turn Action + Dice Readout */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={triggerRoll}
                disabled={!canHumanRoll}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  canHumanRoll
                    ? 'bg-gold-400 hover:bg-gold-300 text-ink-950'
                    : 'bg-white/8 text-ink-400 cursor-not-allowed'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>
                  {phase === 'rolling'
                    ? m.dock.rolling
                    : phase === 'choosing_move'
                      ? m.dock.chooseDest
                      : phase === 'moving'
                        ? m.dock.moving
                        : activePlayer?.isCpu
                          ? m.dock.cpuTurn(activePlayer.name)
                          : m.dock.roll}
                </span>
              </button>

              {diceValue !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-raised border border-white/10">
                  <span className="text-xs text-ink-400">{m.dock.die}</span>
                  <span className="font-mono-tabular text-base font-bold text-gold-300">
                    {diceValue}
                  </span>
                </div>
              )}

              {isHumanChoosing && destinationOptions.length > 0 && (
                <div
                  className="flex items-center gap-1.5 flex-wrap"
                  role="group"
                  aria-label={m.dock.reachable}
                >
                  {destinationOptions.map((sp, i) => {
                    const swatch = sp.category
                      ? CATEGORIES[sp.category].hex
                      : sp.kind === 'hub'
                        ? HUB_SWATCH
                        : '#fbf6ea';
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => {
                          soundFX.playUiClick();
                          chooseMovePath(sp.id);
                        }}
                        onMouseEnter={() => sceneRef.current?.setPreviewSpace(sp.id)}
                        onMouseLeave={() => sceneRef.current?.setPreviewSpace(null)}
                        onFocus={() => sceneRef.current?.setPreviewSpace(sp.id)}
                        onBlur={() => sceneRef.current?.setPreviewSpace(null)}
                        title={m.dock.destTitle(spaceLabel(sp, m), i + 1)}
                        className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg bg-raised border border-white/10 hover:border-gold-400/70 focus-visible:border-gold-400 text-xs text-ink-100 transition-colors whitespace-nowrap"
                      >
                        <span className="font-mono-tabular text-[10px] text-ink-400">
                          {i + 1}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-sm border border-black/20"
                          style={{ background: swatch }}
                        />
                        <span>
                          {sp.kind === 'hq'
                            ? m.spaces.chipHq
                            : sp.kind === 'hub'
                              ? m.spaces.chipHub
                              : sp.kind === 'roll_again'
                                ? m.spaces.chipRoll
                                : sp.category
                                  ? m.categories[sp.category].short
                                  : spaceLabel(sp, m)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {highlightFilter !== 'none' && (
                <button
                  type="button"
                  onClick={() => setHighlightFilter('none')}
                  className="px-3 py-1.5 rounded-lg bg-lila-500/15 border border-lila-400/40 text-xs font-medium text-lila-200 hover:bg-lila-500/25 transition-colors whitespace-nowrap"
                >
                  {m.dock.clearHighlight}
                </button>
              )}
            </div>

            {/* Camera Presets + Sound Toggle */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center p-1 rounded-lg bg-sunken border border-white/8"
                role="group"
                aria-label={m.dock.cameraViews}
              >
                {(['overview', 'top', '2d', 'follow'] as CameraPreset[]).map((presetId) => (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => handleCameraPreset(presetId)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      cameraPreset === presetId
                        ? 'bg-white/14 text-white'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {m.dock.cameras[presetId]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className="p-2 rounded-lg bg-raised border border-white/10 text-ink-300 hover:text-white transition-colors"
                aria-label={soundEnabled ? m.dock.mute : m.dock.unmute}
                title={soundEnabled ? m.dock.soundOn : m.dock.soundOff}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gold-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-ink-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Dock Floating Restore Button */}
      {dockCollapsed && (
        <button
          type="button"
          onClick={() => setDockCollapsed(false)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-panel/94 border border-white/12 text-xs font-medium text-ink-200 hover:text-white shadow-lg whitespace-nowrap"
        >
          <ChevronUp className="w-3.5 h-3.5 text-gold-400" />
          <span>{m.dock.showH}</span>
        </button>
      )}

      {/* Interactive Challenge Modal */}
      <ChallengeModal
        challenge={activeChallenge}
        player={
          activeChallenge
            ? players.find((p) => p.id === activeChallenge.playerId) ?? null
            : null
        }
        matchLength={matchLength}
        onSelectHubCategory={handleSelectHubCategory}
        onSelectAnswer={handleSelectAnswer}
        onConfirmOutcome={handleConfirmOutcome}
      />

      {/* Player Category Progress Modal */}
      <PlayerProgressModal
        players={players}
        selectedPlayerId={inspectedPlayerId}
        difficulty={difficulty}
        matchLength={matchLength}
        onSelectPlayer={(id) => {
          soundFX.playUiClick();
          setInspectedPlayerId(id);
        }}
        onClose={() => setInspectedPlayerId(null)}
      />

      {/* Rules & Board Analysis Modal */}
      <RulesAnalysisModal
        open={rulesOpen}
        activeFilter={highlightFilter}
        onSelectFilter={setHighlightFilter}
        onClose={() => setRulesOpen(false)}
      />

      {/* Descargas para jugar en papel */}
      <PrintablesModal open={printablesOpen} onClose={() => setPrintablesOpen(false)} />

      {/* Match Setup Modal */}
      <SetupModal
        open={setupOpen}
        initialPlayers={players}
        initialDifficulty={difficulty}
        initialMatchLength={matchLength}
        onStartGame={handleStartNewGame}
        onClose={() => setSetupOpen(false)}
      />

      {/* Victory Modal */}
      {phase === 'won' && winnerPlayer && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-panel border border-gold-400/40 rounded-xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold-400/15 border border-gold-400/40 flex items-center justify-center text-gold-300">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {m.victory.title(winnerPlayer.name)}
            </h2>
            <p className="text-sm text-ink-300 mb-6">
              {m.victory.body}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="px-4 py-2 rounded-lg bg-gold-400 hover:bg-gold-300 text-ink-950 text-sm font-semibold transition-colors"
              >
                {m.victory.again}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
