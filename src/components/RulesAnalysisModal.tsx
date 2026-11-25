import React from 'react';
import { X, Eye, Compass, Layers, ArrowRightLeft, Trophy } from 'lucide-react';
import { CATEGORIES, CATEGORY_ORDER } from '../game/boardTopology';
import type { HighlightFilter } from '../game/types';
import { CategoryEmblemSvg } from './CategoryEmblemSvg';
import { useI18n } from '../i18n/I18nContext';

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
  const { m } = useI18n();
  const r = m.rules;
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
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-panel border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2
              id="rules-modal-title"
              className="text-xl font-semibold text-ink-50 tracking-tight"
            >
              {r.title}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              {r.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label={r.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5 space-y-7 text-sm text-ink-300 leading-relaxed">
          {/* Section 1: Topology */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-gold-400 shrink-0" />
              <h3 className="text-base font-semibold text-ink-100">
                {r.s1}
              </h3>
            </div>
            <p className="text-ink-300 mb-4">
              {r.s1Body}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => inspectOnBoard('hub')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'hub'
                    ? 'bg-gold-500/15 border-gold-400/60 text-white'
                    : 'bg-raised border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-100">{r.hub[0]}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{r.hub[1]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-gold-300">1</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_hq')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_hq'
                    ? 'bg-gold-500/15 border-gold-400/60 text-white'
                    : 'bg-raised border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-100">{r.hq[0]}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{r.hq[1]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-gold-300">6</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_spokes')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_spokes'
                    ? 'bg-gold-500/15 border-gold-400/60 text-white'
                    : 'bg-raised border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-100">{r.spokes[0]}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{r.spokes[1]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-gold-300">30</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_roll_again')}
                className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_roll_again'
                    ? 'bg-gold-500/15 border-gold-400/60 text-white'
                    : 'bg-raised border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-100">{r.roll[0]}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{r.roll[1]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-gold-300">6</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => inspectOnBoard('all_ring')}
                className={`sm:col-span-2 flex items-center justify-between p-3.5 rounded-lg border text-left transition-colors ${
                  activeFilter === 'all_ring'
                    ? 'bg-gold-500/15 border-gold-400/60 text-white'
                    : 'bg-raised border-white/8 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="font-medium text-ink-100">{r.ring[0]}</div>
                  <div className="text-xs text-ink-400 mt-0.5">{r.ring[1]}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-sm font-semibold text-gold-300">36</span>
                  <Eye className="w-4 h-4 text-ink-400" />
                </div>
              </button>
            </div>
          </section>

          {/* Section 2: Unnamed Color Categories */}
          <section className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-gold-400 shrink-0" />
              <h3 className="text-base font-semibold text-ink-100">
                {r.s2}
              </h3>
            </div>
            <p className="text-ink-300 mb-4">
              {r.s2Body}
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
                        ? 'bg-white/10 border-gold-400/70'
                        : 'bg-raised border-white/8 hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner"
                      style={{ backgroundColor: cat.hex }}
                    >
                      <CategoryEmblemSvg emblem={cat.emblem} className="w-5 h-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-ink-100 leading-snug">
                        {m.categories[catId].name}
                      </div>
                      <div className="text-xs text-ink-400 truncate">
                        {r.catSpaces(m.categories[catId].color)}
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
              <ArrowRightLeft className="w-4 h-4 text-gold-400 shrink-0" />
              <h3 className="text-base font-semibold text-ink-100">
                {r.s3}
              </h3>
            </div>
            <ul className="space-y-2.5 text-ink-300 list-disc pl-5">
              {r.s3Items.map(([title, body]) => (
                <li key={title}>
                  <strong className="text-ink-100 font-medium">{title}</strong>{' '}
                  {body}
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4: Winning */}
          <section className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2.5">
              <Trophy className="w-4 h-4 text-gold-400 shrink-0" />
              <h3 className="text-base font-semibold text-ink-100">
                {r.s4}
              </h3>
            </div>
            <ul className="space-y-2.5 text-ink-300 list-disc pl-5">
              {r.s4Items.map(([title, body]) => (
                <li key={title}>
                  <strong className="text-ink-100 font-medium">{title}</strong>{' '}
                  {body}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-sunken">
          <div className="text-xs text-ink-400">
            {activeFilter === 'none'
              ? r.normalView
              : r.filterView}
          </div>
          <div className="flex items-center gap-2.5">
            {activeFilter !== 'none' && (
              <button
                type="button"
                onClick={() => onSelectFilter('none')}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-white/8 text-ink-200 hover:bg-white/14 transition-colors whitespace-nowrap"
              >
                {r.clear}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gold-400 text-ink-950 hover:bg-gold-300 transition-colors whitespace-nowrap"
            >
              {r.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
