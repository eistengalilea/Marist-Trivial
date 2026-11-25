import React from 'react';
import { X, Eye, Compass, Layers, ArrowRightLeft, Trophy } from 'lucide-react';
import { CATEGORIES, CATEGORY_ORDER } from '../game/boardTopology';
import type { HighlightFilter } from '../game/types';
import { CategoryEmblemSvg } from './CategoryEmblemSvg';

interface RulesAnalysisModalProps {
  open: boolean;
  activeFilter: HighlightFilter;
  onSelectFilter: (filter: HighlightFilter) => void;
  onClose: () => void;
}

export const RulesAnalysisModal: React.FC<RulesAnalysisModalProps> = ({
  open,
  activeFilter,
  onSelectFilter,
  onClose,
}) => {
  if (!open) return null;

  const inspectOnBoard = (filter: HighlightFilter) => {
    onSelectFilter(activeFilter === filter ? 'none' : filter);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#131722] border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2
              id="rules-modal-title"
              className="text-xl font-semibold text-slate-50 tracking-tight"
            >
              Análisis de normas y arquitectura del tablero
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tablero cuadrado de 79 casillas · Categorías por color pendientes de nombrar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Cerrar análisis de normas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5 space-y-7 text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Topology */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">
                1. Estructura geométrica del tablero cuadrado (79 casillas)
              </h3>
            </div>
            <p className="text-slate-300 mb-4">
              El tablero cuadrado de Marist Trivial combina un circuito perimetral de 48 casillas (12 pasos por lado) con seis radios rectos que convergen en la casilla central. Pulsa cualquier grupo para iluminarlo sobre el tablero:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => inspectOnBoard('hub')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'hub'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">Casilla Central</div>
                  <div className="text-xs text-slate-400 mt-0.5">Punto de partida y meta final</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-amber-300">1</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_hq')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_hq'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">Sedes de Quesito (cada 8 pasos)</div>
                  <div className="text-xs text-slate-400 mt-0.5">Otorgan cuña de color al acertar</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-amber-300">6</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_spokes')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_spokes'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">Casillas Radiales (6 × 5)</div>
                  <div className="text-xs text-slate-400 mt-0.5">5 pasos por radio con los otros 5 colores</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-amber-300">30</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_roll_again')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_roll_again'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">Casillas «Vuelve a tirar»</div>
                  <div className="text-xs text-slate-400 mt-0.5">Alternadas entre sedes y en 2 esquinas</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-amber-300">6</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_ring')}
                className={`sm:col-span-2 flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_ring'
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-100">Casillas de Color en Perímetro Cuadrado (6 × 6)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    6 colores equilibrados entre cada pareja de Sedes de Quesito (12 casillas por color en total)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-amber-300">36</span>
                  <Eye className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            </div>
          </section>

          {/* Section 2: Unnamed Color Categories */}
          <section className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">
                2. Categorías por color y emblema (sin nombrar)
              </h3>
            </div>
            <p className="text-slate-300 mb-4">
              El tablero distribuye las seis categorías de forma simétrica: cada color posee exactamente 1 Sede de Quesito, 6 casillas perimetrales y 5 casillas radiales. Por ahora se identifican únicamente por su color y emblema geométrico:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORY_ORDER.map((catId) => {
                const cat = CATEGORIES[catId];
                const isSelected = activeFilter === catId;
                return (
                  <button
                    key={catId}
                    type="button"
                    onClick={() => inspectOnBoard(catId)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-white/10 border-amber-400/70'
                        : 'bg-[#1a202e] border-white/8 hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner"
                      style={{ backgroundColor: cat.hex }}
                    >
                      <CategoryEmblemSvg emblem={cat.emblem} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-100 truncate">
                        Color {cat.colorName}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        12 casillas · Sin tema
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 3: Core Rules */}
          <section className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">
                3. Mecánica de turno, bifurcaciones y movimiento
              </h3>
            </div>
            <ul className="space-y-2.5 text-slate-300 list-disc pl-5">
              <li>
                <strong className="text-slate-100 font-medium">Inicio en el centro:</strong>{' '}
                Todas las fichas parten desde la Casilla Central con sus 6 huecos vacíos y tiran el dado (1–6) para salir por cualquiera de los 6 radios.
              </li>
              <li>
                <strong className="text-slate-100 font-medium">Rutas sin retroceso en una tirada:</strong>{' '}
                El jugador debe avanzar exactamente el número del dado por cualquier camino válido. Puede girar en las sedes exteriores o atravesar el centro hacia otro radio, pero nunca retroceder sobre sus propios pasos dentro del mismo desplazamiento.
              </li>
              <li>
                <strong className="text-slate-100 font-medium">Acierto y conservación de turno:</strong>{' '}
                Al caer en una casilla de color, se plantea un desafío de ese color. Si acierta, conserva el turno y vuelve a tirar; si falla, el turno pasa al siguiente jugador.
              </li>
              <li>
                <strong className="text-slate-100 font-medium">Vuelve a tirar:</strong>{' '}
                Las 6 casillas blancas con el símbolo de dado conceden inmediatamente una tirada adicional sin necesidad de responder pregunta.
              </li>
            </ul>
          </section>

          {/* Section 4: Winning */}
          <section className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2.5">
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-100">
                4. Duración, niveles, quesitos y condición de victoria
              </h3>
            </div>
            <ul className="space-y-2.5 text-slate-300 list-disc pl-5">
              <li>
                <strong className="text-slate-100 font-medium">Partida Rápida, Media o Larga:</strong>{' '}
                Al iniciar partida eliges cuántas preguntas acertadas del mismo color se necesitan para conseguir cada quesito: 1 en Rápida, 2 en Media o 4 en Larga. El nivel (Fácil, Medio o Difícil) regula la dificultad de las tarjetas. Pulsa sobre cualquier jugador en el marcador superior para ver cuántas preguntas le faltan por color.
              </li>
              <li>
                <strong className="text-slate-100 font-medium">Asalto final a la Casilla Central:</strong>{' '}
                Reunidos los 6 quesitos de colores, el jugador debe regresar exactamente a la Casilla Central (sin pasarse en la tirada) y superar el desafío final para proclamarse vencedor.
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-[#0f131c]">
          <div className="text-xs text-slate-400">
            {activeFilter === 'none'
              ? 'Vista normal del tablero 3D activa'
              : 'Filtro visual activo sobre el tablero 3D'}
          </div>
          <div className="flex items-center gap-2.5">
            {activeFilter !== 'none' && (
              <button
                type="button"
                onClick={() => onSelectFilter('none')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-white/8 text-slate-200 hover:bg-white/14 transition-colors whitespace-nowrap"
              >
                Limpiar resaltado
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              Volver al tablero 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
