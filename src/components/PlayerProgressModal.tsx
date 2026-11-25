import React from 'react';
import { X, CheckCircle2, MapPin } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  DIFFICULTY_CONFIGS,
  MATCH_LENGTH_CONFIGS,
  TRIVIAL_BOARD,
  countPlayerWedges,
} from '../game/boardTopology';
import type { DifficultyLevel, MatchLength, PlayerState } from '../game/types';
import { CategoryEmblemSvg, WedgeWheelSvg } from './CategoryEmblemSvg';

interface PlayerProgressModalProps {
  players: PlayerState[];
  selectedPlayerId: string | null;
  difficulty: DifficultyLevel;
  matchLength: MatchLength;
  onSelectPlayer: (playerId: string) => void;
  onClose: () => void;
}

export const PlayerProgressModal: React.FC<PlayerProgressModalProps> = ({
  players,
  selectedPlayerId,
  difficulty,
  matchLength,
  onSelectPlayer,
  onClose,
}) => {
  if (!selectedPlayerId) return null;
  const player = players.find((p) => p.id === selectedPlayerId);
  if (!player) return null;

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const lengthConfig = MATCH_LENGTH_CONFIGS[matchLength];
  const required = lengthConfig.questionsPerWedge;
  const wedgesDone = countPlayerWedges(player.wedges);
  const currentSpaceLabel =
    TRIVIAL_BOARD.spaceMap.get(player.spaceId)?.label ?? 'Casilla Central';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-progress-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[88vh] flex flex-col bg-panel border border-white/12 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <WedgeWheelSvg
              wedges={player.wedges}
              rimHex={player.rimHex}
              size={44}
            />
            <div className="min-w-0">
              <h2
                id="player-progress-title"
                className="text-lg font-semibold text-white truncate"
              >
                {player.name}
                {player.isCpu ? ' · CPU' : ''}
              </h2>
              <div className="flex items-center gap-2 text-xs text-ink-400 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gold-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{currentSpaceLabel}</span>
                </span>
                <span>·</span>
                <span className="font-mono-tabular text-gold-300 font-medium">
                  {wedgesDone}/6 quesitos
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/8 transition-colors shrink-0"
            aria-label="Cerrar progreso del jugador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Player Switcher Tabs */}
        {players.length > 1 && (
          <div className="px-6 py-2.5 border-b border-white/8 bg-sunken flex items-center gap-2 overflow-x-auto">
            {players.map((p) => {
              const active = p.id === player.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPlayer(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-gold-400/15 border-gold-400/60 text-white'
                      : 'bg-raised border-white/8 text-ink-400 hover:text-ink-200 hover:border-white/20'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.rimHex }}
                  />
                  <span>{p.name}</span>
                  <span className="font-mono-tabular text-[11px] opacity-80">
                    {countPlayerWedges(p.wedges)}/6
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Per-Category Breakdown */}
        <div className="flex-1 overflow-y-auto custom-scroll p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-ink-400">
            <span>Progreso por categoría para completar quesitos</span>
            <span className="font-medium text-ink-300">
              Partida {lengthConfig.label} ({required}{' '}
              {required === 1 ? 'pregunta' : 'preguntas'}/quesito) · Nivel{' '}
              {diffConfig.label}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORY_ORDER.map((catId) => {
              const cat = CATEGORIES[catId];
              const hasWedge = player.wedges[catId];
              const progress = hasWedge
                ? required
                : Math.min(player.categoryProgress[catId] ?? 0, required);
              const remaining = hasWedge ? 0 : Math.max(0, required - progress);
              const pct = Math.round((progress / required) * 100);

              return (
                <div
                  key={catId}
                  className={`p-3.5 rounded-lg border transition-colors ${
                    hasWedge
                      ? 'bg-leaf-500/8 border-leaf-400/35'
                      : 'bg-raised border-white/8'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.hex }}
                      >
                        <CategoryEmblemSvg
                          emblem={cat.emblem}
                          className="w-4 h-4"
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          Color {cat.colorName}
                        </div>
                        <div className="text-[11px] text-ink-400">
                          {hasWedge ? (
                            <span className="inline-flex items-center gap-1 text-leaf-300 font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Quesito completado
                            </span>
                          ) : remaining === 1 ? (
                            <span className="text-gold-300 font-medium">
                              Falta 1 pregunta para el quesito
                            </span>
                          ) : (
                            <span>
                              Faltan {remaining} preguntas para el quesito
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono-tabular text-xs font-semibold text-ink-200 shrink-0">
                      {progress}/{required}
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: hasWedge ? '#62a329' : cat.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-white/10 bg-sunken">
          <div className="text-xs text-ink-400">
            {wedgesDone === 6
              ? 'Todos los quesitos completados. Dirígete a la Casilla Central.'
              : `Faltan ${6 - wedgesDone} ${
                  6 - wedgesDone === 1 ? 'quesito' : 'quesitos'
                } para optar al triunfo final.`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gold-400 text-ink-950 hover:bg-gold-300 transition-colors whitespace-nowrap"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
