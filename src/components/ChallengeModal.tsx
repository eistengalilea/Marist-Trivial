import React from 'react';
import { Check, X, Trophy, ArrowRight } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  MATCH_LENGTH_CONFIGS,
} from '../game/boardTopology';
import type {
  ActiveChallenge,
  CategoryColorId,
  MatchLength,
  PlayerState,
} from '../game/types';
import { CategoryEmblemSvg } from './CategoryEmblemSvg';
import { localizeQuestion, useI18n } from '../i18n/I18nContext';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

interface ChallengeModalProps {
  challenge: ActiveChallenge | null;
  player: PlayerState | null;
  matchLength: MatchLength;
  onSelectHubCategory: (catId: CategoryColorId) => void;
  onSelectAnswer: (optionIndex: number) => void;
  onConfirmOutcome: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  player,
  matchLength,
  onSelectHubCategory,
  onSelectAnswer,
  onConfirmOutcome,
}) => {
  const { lang, m } = useI18n();
  if (!challenge || !player) return null;

  // Step 1 (if landing on Central Hub without 6 wedges): pick color category
  if (challenge.needsCategoryChoice && !challenge.category) {
    return (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md bg-panel border border-white/12 rounded-xl shadow-2xl p-6">
          <div className="text-xs text-gold-300 font-medium mb-1">
            {player.name} · {m.spaces.hub}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {m.challenge.hubTitle}
          </h3>
          <p className="text-xs text-ink-400 mb-5 leading-relaxed">
            {m.challenge.hubBody}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORY_ORDER.map((catId) => {
              const cat = CATEGORIES[catId];
              return (
                <button
                  key={catId}
                  type="button"
                  disabled={player.isCpu}
                  onClick={() => onSelectHubCategory(catId)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-raised border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-75"
                >
                  <span
                    className="w-8 h-8 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.hex }}
                  >
                    <CategoryEmblemSvg emblem={cat.emblem} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-100 leading-tight">
                      {m.categories[catId].name}
                    </span>
                    <span className="block text-[11px] text-ink-400">
                      {m.categories[catId].color}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const cat = challenge.category ? CATEGORIES[challenge.category] : null;
  const question = challenge.question
    ? localizeQuestion(challenge.question, lang)
    : null;
  if (!cat || !question) return null;
  const catText = m.categories[cat.id];

  const lengthConfig = MATCH_LENGTH_CONFIGS[matchLength];
  const required = lengthConfig.questionsPerWedge;
  const isHQ = challenge.kind === 'hq';
  const isFinal = challenge.kind === 'final';
  const alreadyHasWedge = player.wedges[cat.id];
  const currentProgress = player.categoryProgress[cat.id] ?? 0;
  const projectedProgress = Math.min(required, currentProgress + 1);
  const completesWedgeNow = !alreadyHasWedge && projectedProgress >= required;
  const remainingAfterSuccess = Math.max(0, required - projectedProgress);

  const isFlipped = challenge.isRevealed;
  const selectedIdx = challenge.selectedOptionIndex;
  const isCorrect = selectedIdx === question.correctIndex;

  const titleText = isFinal
    ? m.challenge.finalTitle(catText.name)
    : isHQ
      ? m.challenge.hqTitle(catText.name)
      : catText.name;

  const ruleOutcomeText = isCorrect
    ? isFinal
      ? m.challenge.finalWin
      : completesWedgeNow
        ? m.challenge.wedgeComplete(catText.short, required)
        : !alreadyHasWedge
          ? m.challenge.progress(
              catText.short,
              projectedProgress,
              required,
              m.remaining(remainingAfterSuccess),
            )
          : m.challenge.correctKeep
    : m.challenge.wrongPass;

  const continueLabel = isCorrect
    ? isFinal
      ? m.challenge.proclaim
      : completesWedgeNow
        ? m.challenge.collect(catText.short)
        : m.challenge.rollAgain
    : m.challenge.passTurn;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55 pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg card-perspective">
        <div
          className={`grid card-preserve-3d ${
            isFlipped ? 'card-flipped' : ''
          }`}
        >
          {/* ==================== FRONT FACE: QUESTION & OPTIONS ==================== */}
          <div className="col-start-1 row-start-1 card-face bg-panel border border-white/14 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div
              className="px-6 py-4 flex items-center justify-between text-white"
              style={{ backgroundColor: cat.hex }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/22 flex items-center justify-center shrink-0">
                  {isFinal ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <CategoryEmblemSvg emblem={cat.emblem} className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs opacity-90">
                    {m.challenge.turnOf(player.name)}
                    {player.isCpu ? ' (CPU)' : ''}
                  </div>
                  <h3 className="text-base font-semibold leading-tight">
                    {titleText}
                  </h3>
                </div>
              </div>
              {!isFinal && !alreadyHasWedge && (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded bg-black/25 whitespace-nowrap font-mono-tabular">
                  {completesWedgeNow
                    ? m.challenge.atStake
                    : `${currentProgress}/${required} · +1`}
                </span>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-base sm:text-lg font-medium text-white leading-snug mb-5">
                  {question.prompt}
                </p>

                <div className="space-y-2.5">
                  {question.options.map((optionText, idx) => {
                    const isPicked = selectedIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={player.isCpu || isFlipped}
                        onClick={() => onSelectAnswer(idx)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-lg border text-left transition-colors ${
                          isPicked
                            ? 'bg-gold-400/20 border-gold-400 text-white'
                            : 'bg-raised border-white/10 text-ink-100 hover:border-gold-400/60 hover:bg-raised-hover disabled:hover:border-white/10 disabled:hover:bg-raised'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center text-xs font-mono-tabular font-semibold text-gold-300 shrink-0">
                          {OPTION_LETTERS[idx]}
                        </span>
                        <span className="text-sm font-medium leading-snug">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/8 text-xs text-ink-400 flex items-center justify-between">
                <span>
                  {player.isCpu
                    ? m.challenge.cpuChoosing(player.name)
                    : m.challenge.selectOption}
                </span>
                <span>{catText.name}</span>
              </div>
            </div>
          </div>

          {/* ==================== BACK FACE: REVEALED ANSWER ==================== */}
          <div className="col-start-1 row-start-1 card-face card-face-back bg-panel border border-white/14 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div
              className={`px-6 py-4 flex items-center justify-between text-white ${
                isCorrect ? 'bg-leaf-600' : 'bg-magenta-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-black/22 flex items-center justify-center shrink-0">
                  {isCorrect ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-xs opacity-90">
                    {player.name} · {catText.name}
                  </div>
                  <h3 className="text-base font-semibold leading-tight">
                    {isCorrect ? m.challenge.correct : m.challenge.wrong}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-ink-300 mb-4 leading-snug">
                  {question.prompt}
                </p>

                <div className="space-y-2 mb-4">
                  {question.options.map((optionText, idx) => {
                    const isRightOption = idx === question.correctIndex;
                    const isPlayerPick = idx === selectedIdx;
                    let rowStyle =
                      'bg-sunken border-white/6 text-ink-400 opacity-75';
                    if (isRightOption) {
                      rowStyle =
                        'bg-leaf-500/15 border-leaf-400/70 text-leaf-100 opacity-100';
                    } else if (isPlayerPick && !isRightOption) {
                      rowStyle =
                        'bg-magenta-500/15 border-magenta-400/60 text-magenta-200 opacity-100';
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-sm ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono-tabular text-xs font-semibold shrink-0">
                            {OPTION_LETTERS[idx]}.
                          </span>
                          <span className="truncate font-medium">
                            {optionText}
                          </span>
                        </div>
                        {isRightOption && (
                          <Check className="w-4 h-4 text-leaf-400 shrink-0" />
                        )}
                        {isPlayerPick && !isRightOption && (
                          <X className="w-4 h-4 text-magenta-400 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-lg bg-raised border border-white/8 text-xs text-ink-300 leading-relaxed">
                  {question.explanation}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-xs text-ink-200 font-medium">
                  {ruleOutcomeText}
                </div>

                {!player.isCpu ? (
                  <button
                    type="button"
                    onClick={onConfirmOutcome}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-400 hover:bg-gold-300 text-ink-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{continueLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-ink-400 whitespace-nowrap shrink-0">
                    {m.challenge.continuing}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
