import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Dices,
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
import { drawQuestionForColor } from './game/questions';
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
import { ChallengeModal } from './components/ChallengeModal';
import { SetupModal } from './components/SetupModal';
import { PlayerProgressModal } from './components/PlayerProgressModal';

const DEFAULT_PLAYERS: PlayerConfig[] = [
  { id: 'p1', name: 'Jugador 1', rimHex: '#f1ece1', isCpu: false },
  { id: 'p2', name: 'Jugador 2', rimHex: '#d4af37', isCpu: true },
];

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
  const usedQuestionIdsRef = useRef<Set<string>>(new Set());

  const [players, setPlayers] = useState<PlayerState[]>(() =>
    buildInitialPlayers(DEFAULT_PLAYERS),
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
  const [setupOpen, setSetupOpen] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Todas las fichas parten de la Casilla Central. Tira el dado para comenzar.',
  );

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

  const advanceTurn = useCallback((nextMessage?: string) => {
    setActivePlayerIdx((prev) => {
      const next = (prev + 1) % stateRef.current.players.length;
      const nextPlayer = stateRef.current.players[next];
      if (nextMessage) {
        setStatusMessage(`${nextMessage} Turno de ${nextPlayer.name}.`);
      } else {
        setStatusMessage(`Turno de ${nextPlayer.name}. Tira el dado.`);
      }
      return next;
    });
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
      setStatusMessage(`${player.name} avanza hacia ${destSpace.label}.`);
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
      setStatusMessage(
        `${player.name} cayó en «Vuelve a tirar». Conserva el turno y tira de nuevo.`,
      );
      return;
    }

    const wedgeCount = countPlayerWedges(player.wedges);

    // 2. Central Hub arrival
    if (space.kind === 'hub') {
      if (wedgeCount === 6) {
        const randomCat =
          CATEGORY_ORDER[Math.floor(Math.random() * CATEGORY_ORDER.length)];
        const q = drawQuestionForColor(
          randomCat,
          stateRef.current.difficulty,
          usedQuestionIdsRef.current,
        );
        usedQuestionIdsRef.current.add(q.id);
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
        setStatusMessage(
          `${player.name} ha llegado al centro con los 6 quesitos. Prueba final en Color ${CATEGORIES[randomCat].colorName}.`,
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
        setStatusMessage(
          `${player.name} cayó en la Casilla Central. Elige el color de la pregunta.`,
        );
      }
      return;
    }

    // 3. Standard or HQ colored space
    if (space.category) {
      const q = drawQuestionForColor(
        space.category,
        stateRef.current.difficulty,
        usedQuestionIdsRef.current,
      );
      usedQuestionIdsRef.current.add(q.id);
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
      setStatusMessage(
        `${player.name} cayó en ${space.label}. Responde la pregunta en pantalla.`,
      );
    }
  }, []);

  const handleDieSettled = useCallback((value: number) => {
    const { players: curPlayers, activePlayerIdx: curIdx } = stateRef.current;
    const player = curPlayers[curIdx];
    if (!player) return;

    const moves = findValidMoves(player.spaceId, value);
    setValidMoves(moves);
    setPhase('choosing_move');
    const destIds = Array.from(moves.keys());
    sceneRef.current?.setValidDestinations(destIds);
    setStatusMessage(
      `${player.name} sacó un ${value}. Elige una de las ${destIds.length} casillas iluminadas.`,
    );
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

  // Keyboard shortcut H to toggle bottom controls dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const triggerRoll = useCallback(() => {
    if (phase !== 'idle' || !activePlayer) return;
    const rolled = Math.floor(Math.random() * 6) + 1;
    setDiceValue(rolled);
    setPhase('rolling');
    setStatusMessage(`${activePlayer.name} lanza el dado…`);
    soundFX.playDiceRoll();
    sceneRef.current?.rollDie(rolled);
  }, [phase, activePlayer]);

  const handleSelectHubCategory = useCallback((catId: CategoryColorId) => {
    soundFX.playUiClick();
    const q = drawQuestionForColor(
      catId,
      stateRef.current.difficulty,
      usedQuestionIdsRef.current,
    );
    usedQuestionIdsRef.current.add(q.id);
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
  }, []);

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
      advanceTurn('Respuesta incorrecta.');
      return;
    }

    if (kind === 'final') {
      setWinnerId(playerId);
      setActiveChallenge(null);
      setPhase('won');
      const winPlayer = stateRef.current.players.find((p) => p.id === playerId);
      setStatusMessage(
        `¡${winPlayer?.name ?? 'El jugador'} ha completado el desafío final en el centro y gana la partida!`,
      );
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
      setStatusMessage(
        `¡Quesito ${CATEGORIES[category].colorName} completado! ${currentPlayer?.name ?? ''} conserva el turno.`,
      );
    } else if (category && currentPlayer && !currentPlayer.wedges[category]) {
      const remaining = Math.max(0, required - nextProgress);
      setStatusMessage(
        `¡Acierto! ${currentPlayer.name}: ${nextProgress}/${required} en ${CATEGORIES[category].colorName} (${
          remaining === 1 ? 'falta 1 pregunta' : `faltan ${remaining} preguntas`
        }). Conserva el turno.`,
      );
    } else {
      setStatusMessage(
        `¡Acierto! ${currentPlayer?.name ?? ''} conserva el turno y vuelve a tirar.`,
      );
    }

    setActiveChallenge(null);
    setDiceValue(null);
    setPendingDestId(null);
    setPhase('idle');
  }, [advanceTurn]);

  // CPU Autonomous Turn Choreography
  useEffect(() => {
    if (!activePlayer || !activePlayer.isCpu) return;
    if (rulesOpen || setupOpen || inspectedPlayerId !== null) return;

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
    usedQuestionIdsRef.current.clear();
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
    setStatusMessage(
      `Nueva partida ${MATCH_LENGTH_CONFIGS[nextMatchLength].label.toLowerCase()} (nivel ${DIFFICULTY_CONFIGS[nextDifficulty].label}). Turno de ${fresh[0].name} desde la Casilla Central.`,
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
    !setupOpen &&
    inspectedPlayerId === null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0e1117]">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e1117] p-6 text-center">
          <div className="max-w-sm p-6 rounded-xl bg-[#131722] border border-white/12">
            <h2 className="text-lg font-semibold text-white mb-2">
              Contexto gráfico interrumpido
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              El visor 3D perdió temporalmente el acceso a WebGL. Recarga la página si no se restaura automáticamente.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 text-sm font-semibold"
            >
              Recargar tablero
            </button>
          </div>
        </div>
      )}

      {/* Top-Left Minimal Brand & Clickable Player Progress Strip */}
      <header className="fixed top-4 left-4 z-10 pointer-events-none max-w-[calc(100vw-290px)]">
        <div className="pointer-events-auto inline-flex flex-col gap-2.5 bg-[#131722]/94 border border-white/10 rounded-xl px-4 py-3 shadow-lg">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Marist Trivial
            </h1>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              Partida {MATCH_LENGTH_CONFIGS[matchLength].label} · Nivel{' '}
              {DIFFICULTY_CONFIGS[difficulty].label} · Clic en un jugador para ver progreso
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
                  title="Pulsa para ver cuántas preguntas faltan en cada categoría"
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg border-b-2 transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'border-amber-400 bg-white/8 text-white hover:bg-white/12'
                      : 'border-transparent text-slate-300 hover:bg-white/6 hover:text-white'
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
                    <div className="text-[11px] font-mono-tabular text-slate-400">
                      {wedgesDone}/6 quesitos
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
        <button
          type="button"
          onClick={() => {
            soundFX.playUiClick();
            setRulesOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#131722]/94 border border-white/12 hover:border-amber-400/50 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shadow-lg"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Normas y tablero</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundFX.playUiClick();
            setSetupOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#131722]/94 border border-white/12 hover:border-white/30 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shadow-lg"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
          <span>Nueva partida</span>
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#131722]/94 border border-b-0 border-white/12 text-[11px] font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
            title="Atajo: tecla H"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Mostrar controles</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Ocultar controles</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-[#131722]/95 border border-white/12 rounded-xl px-4 py-3 shadow-2xl flex flex-col gap-2.5">
          {/* Status & Hover Inspection Line */}
          <div className="flex items-center justify-between gap-4 text-xs border-b border-white/8 pb-2">
            <div className="text-slate-200 truncate">{statusMessage}</div>
            <div className="text-slate-400 shrink-0 whitespace-nowrap font-medium">
              {hoveredSpace
                ? hoveredSpace.label
                : highlightFilter !== 'none'
                  ? 'Filtro de tablero activo'
                  : cameraPreset === '2d'
                    ? 'Vista 2D · Arrastra para mover · Rueda para zoom'
                    : 'Arrastra para orbitar · Rueda para zoom'}
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
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    : 'bg-white/8 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Dices className="w-4 h-4" />
                <span>
                  {phase === 'rolling'
                    ? 'Lanzando dado…'
                    : phase === 'choosing_move'
                      ? 'Elige destino en el tablero'
                      : phase === 'moving'
                        ? 'Desplazando ficha…'
                        : activePlayer?.isCpu
                          ? `Turno de ${activePlayer.name}…`
                          : 'Tirar dado'}
                </span>
              </button>

              {diceValue !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a202e] border border-white/10">
                  <span className="text-xs text-slate-400">Dado</span>
                  <span className="font-mono-tabular text-base font-bold text-amber-300">
                    {diceValue}
                  </span>
                </div>
              )}

              {highlightFilter !== 'none' && (
                <button
                  type="button"
                  onClick={() => setHighlightFilter('none')}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 border border-sky-400/40 text-xs font-medium text-sky-200 hover:bg-sky-500/25 transition-colors whitespace-nowrap"
                >
                  Quitar resaltado
                </button>
              )}
            </div>

            {/* Camera Presets + Sound Toggle */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center p-1 rounded-lg bg-[#0d1018] border border-white/8"
                role="group"
                aria-label="Vistas de cámara"
              >
                {(
                  [
                    ['overview', 'Panorámica'],
                    ['top', 'Cenital'],
                    ['2d', 'Vista 2D'],
                    ['follow', 'Seguir ficha'],
                  ] as Array<[CameraPreset, string]>
                ).map(([presetId, label]) => (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => handleCameraPreset(presetId)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      cameraPreset === presetId
                        ? 'bg-white/14 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className="p-2 rounded-lg bg-[#1a202e] border border-white/10 text-slate-300 hover:text-white transition-colors"
                aria-label={soundEnabled ? 'Silenciar efectos' : 'Activar efectos'}
                title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
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
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#131722]/94 border border-white/12 text-xs font-medium text-slate-200 hover:text-white shadow-lg whitespace-nowrap"
        >
          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
          <span>Mostrar controles (H)</span>
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
          <div className="w-full max-w-md bg-[#131722] border border-amber-400/40 rounded-xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              ¡{winnerPlayer.name} gana la partida!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Completó los seis quesitos de colores y superó el desafío final en la Casilla Central.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSetupOpen(true)}
                className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-semibold transition-colors"
              >
                Jugar otra partida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
