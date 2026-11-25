import React, { useEffect, useState } from 'react';
import { X, Users, Bot, User, Gauge, Clock } from 'lucide-react';
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  MATCH_LENGTH_CONFIGS,
  MATCH_LENGTH_ORDER,
} from '../game/boardTopology';
import type { DifficultyLevel, MatchLength, PlayerConfig } from '../game/types';

const TOKEN_FINISHES = [
  { label: 'Blanco', hex: '#fbf8f3' },
  { label: 'Amarillo MarCha', hex: '#d5a53c' },
  { label: 'Naranja MarCha', hex: '#d37d00' },
  { label: 'Verde MarCha', hex: '#869830' },
  { label: 'Lila MarCha', hex: '#87689b' },
  { label: 'Magenta MarCha', hex: '#c6007e' },
];

const BASE_DEFAULTS: PlayerConfig[] = [
  { id: 'p1', name: 'Jugador 1', rimHex: '#fbf8f3', isCpu: false },
  { id: 'p2', name: 'Jugador 2', rimHex: '#d5a53c', isCpu: true },
  { id: 'p3', name: 'Jugador 3', rimHex: '#d37d00', isCpu: true },
  { id: 'p4', name: 'Jugador 4', rimHex: '#869830', isCpu: true },
  { id: 'p5', name: 'Jugador 5', rimHex: '#87689b', isCpu: true },
  { id: 'p6', name: 'Jugador 6', rimHex: '#c6007e', isCpu: true },
];

interface SetupModalProps {
  open: boolean;
  initialPlayers: PlayerConfig[];
  initialDifficulty: DifficultyLevel;
  initialMatchLength: MatchLength;
  onStartGame: (
    players: PlayerConfig[],
    difficulty: DifficultyLevel,
    matchLength: MatchLength,
  ) => void;
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  open,
  initialPlayers,
  initialDifficulty,
  initialMatchLength,
  onStartGame,
  onClose,
}) => {
  const [count, setCount] = useState<number>(initialPlayers.length || 2);
  const [difficulty, setDifficulty] =
    useState<DifficultyLevel>(initialDifficulty);
  const [matchLength, setMatchLength] =
    useState<MatchLength>(initialMatchLength);
  const [drafts, setDrafts] = useState<PlayerConfig[]>(() =>
    BASE_DEFAULTS.map((b, i) => initialPlayers[i] ?? b),
  );

  useEffect(() => {
    if (open) {
      setDifficulty(initialDifficulty);
      setMatchLength(initialMatchLength);
      setCount(initialPlayers.length || 2);
      setDrafts(BASE_DEFAULTS.map((b, i) => initialPlayers[i] ?? b));
    }
  }, [open, initialDifficulty, initialMatchLength, initialPlayers]);

  if (!open) return null;

  const updateDraft = (idx: number, patch: Partial<PlayerConfig>) => {
    setDrafts((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );
  };

  const handleConfirm = () => {
    const active = drafts.slice(0, count).map((p, i) => ({
      ...p,
      name: p.name.trim() || `Jugador ${i + 1}`,
    }));
    onStartGame(active, difficulty, matchLength);
  };

  const selectedDiffCfg = DIFFICULTY_CONFIGS[difficulty];
  const selectedLengthCfg = MATCH_LENGTH_CONFIGS[matchLength];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col bg-panel border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-gold-400" />
            <h2 id="setup-modal-title" className="text-lg font-semibold text-white">
              Configurar nueva partida
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/8 transition-colors"
            aria-label="Cerrar configuración"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-5">
          {/* Match Length Selector */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-400 mb-2">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>Duración de la partida</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MATCH_LENGTH_ORDER.map((lenId) => {
                const cfg = MATCH_LENGTH_CONFIGS[lenId];
                const isSelected = matchLength === lenId;
                return (
                  <button
                    key={lenId}
                    type="button"
                    onClick={() => setMatchLength(lenId)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap flex flex-col items-center ${
                      isSelected
                        ? 'bg-gold-400 text-ink-950 border-gold-300 font-semibold'
                        : 'bg-raised text-ink-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span
                      className={`text-[11px] font-normal ${
                        isSelected ? 'text-ink-900/80' : 'text-ink-400'
                      }`}
                    >
                      {cfg.questionsPerWedge}{' '}
                      {cfg.questionsPerWedge === 1 ? 'pregunta' : 'preguntas'}/quesito
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-400">
              {selectedLengthCfg.summary}.
            </p>
          </div>

          {/* Difficulty Selector */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-400 mb-2">
              <Gauge className="w-3.5 h-3.5 text-gold-400" />
              <span>Nivel de dificultad</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_ORDER.map((diffId) => {
                const cfg = DIFFICULTY_CONFIGS[diffId];
                const isSelected = difficulty === diffId;
                return (
                  <button
                    key={diffId}
                    type="button"
                    onClick={() => setDifficulty(diffId)}
                    className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-gold-400 text-ink-950 border-gold-300 font-semibold'
                        : 'bg-raised text-ink-300 border-white/10 hover:border-white/25'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-400">
              {selectedDiffCfg.summary}.
            </p>
          </div>

          {/* Player Count */}
          <div>
            <div className="text-xs font-medium text-ink-400 mb-2">
              Número de jugadores (hasta 6 fichas)
            </div>
            <div className="grid grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                    count === n
                      ? 'bg-gold-400 text-ink-950 border-gold-300 font-semibold'
                      : 'bg-raised text-ink-300 border-white/10 hover:border-white/25'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Player Rows */}
          <div className="space-y-2.5">
            {drafts.slice(0, count).map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-raised border border-white/8"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  {TOKEN_FINISHES.map((fin) => (
                    <button
                      key={fin.hex}
                      type="button"
                      onClick={() => updateDraft(idx, { rimHex: fin.hex })}
                      title={fin.label}
                      aria-label={`Color ${fin.label}`}
                      className={`w-4 h-4 rounded-full border-2 transition-transform ${
                        player.rimHex === fin.hex
                          ? 'border-white scale-115'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: fin.hex }}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  value={player.name}
                  maxLength={18}
                  onChange={(e) => updateDraft(idx, { name: e.target.value })}
                  className="flex-1 min-w-0 bg-sunken border border-white/10 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-400"
                  placeholder={`Jugador ${idx + 1}`}
                />

                <button
                  type="button"
                  onClick={() => updateDraft(idx, { isCpu: !player.isCpu })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border shrink-0 transition-colors whitespace-nowrap ${
                    player.isCpu
                      ? 'bg-lila-500/15 text-lila-300 border-lila-400/35'
                      : 'bg-white/8 text-ink-200 border-white/15'
                  }`}
                >
                  {player.isCpu ? (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>CPU</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>Humano</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-white/10 bg-sunken">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg text-ink-300 hover:bg-white/8 transition-colors whitespace-nowrap"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gold-400 text-ink-950 hover:bg-gold-300 transition-colors whitespace-nowrap"
          >
            Comenzar partida
          </button>
        </div>
      </div>
    </div>
  );
};
