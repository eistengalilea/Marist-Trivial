import React from 'react';
import { Check, X, Trophy, ArrowRight } from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  MATCH_LENGTH_CONFIGS,
  TIMED_SECONDS,
} from '../game/boardTopology';
import type {
  ActiveChallenge,
  CategoryColorId,
  GameMode,
  MatchLength,
  PlayerState,
} from '../game/types';
import { CategoryEmblemSvg } from './CategoryEmblemSvg';
import { MarchaSymbol } from './MarchaSymbol';
import { ChallengeTimer } from './ChallengeTimer';
import { localizeQuestion, useI18n } from '../i18n/I18nContext';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

/**
 * Colores fijos de la tarjeta: es siempre «de papel», igual que la tarjeta
 * imprimible, tanto en modo claro como en modo oscuro.
 */
const CARD = {
  paper: '#ffffff',
  navy: '#312A4E',
  gold: '#D5A53C',
  text: '#3a3550',
  muted: '#6f6589',
  line: 'rgba(49, 42, 78, 0.14)',
} as const;

interface ChallengeModalProps {
  challenge: ActiveChallenge | null;
  player: PlayerState | null;
  matchLength: MatchLength;
  gameMode: GameMode;
  /** Pausa el cronómetro mientras hay otra ventana abierta. */
  paused: boolean;
  onSelectHubCategory: (catId: CategoryColorId) => void;
  onSelectAnswer: (optionIndex: number) => void;
  onConfirmOutcome: () => void;
  onTimeUp: () => void;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  challenge,
  player,
  matchLength,
  gameMode,
  paused,
  onSelectHubCategory,
  onSelectAnswer,
  onConfirmOutcome,
  onTimeUp,
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
                    className="w-8 h-8 rounded-md flex items-center justify-center text-[#fff] shrink-0"
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
  const timedOut = selectedIdx === -1;
  const timed = gameMode === 'timed';

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
    : timedOut
      ? m.challenge.timeUpPass
      : m.challenge.wrongPass;

  const continueLabel = isCorrect
    ? isFinal
      ? m.challenge.proclaim
      : completesWedgeNow
        ? m.challenge.collect(catText.short)
        : m.challenge.rollAgain
    : m.challenge.passTurn;

  const diffLevel = { easy: 1, medium: 2, hard: 3 }[question.difficulty] ?? 1;
  const correctIdx = question.correctIndex;

  /** Cabecera común de la tarjeta, igual que la tarjeta imprimible. */
  const CardHeader: React.FC<{ back?: boolean }> = ({ back }) => (
    <div
      className="px-5 py-3 flex items-center gap-3"
      style={{ backgroundColor: back ? CARD.gold : CARD.navy, color: back ? CARD.navy : '#ffffff' }}
    >
      <MarchaSymbol fill="currentColor" className="w-8 h-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] font-extrabold tracking-wide leading-tight">MARIST TRIVIAL</div>
        <div className="font-display text-[10px] font-semibold tracking-[0.2em] opacity-85">
          {back ? m.challenge.cardAnswer : m.challenge.cardQuestion}
        </div>
      </div>
      <div className="text-right text-[11px] leading-tight opacity-90">
        <div>
          {player.name}
          {player.isCpu ? ' (CPU)' : ''}
        </div>
        {!isFinal && !alreadyHasWedge && (
          <div className="font-mono-tabular font-semibold" style={{ color: back ? CARD.navy : CARD.gold }}>
            {completesWedgeNow ? m.challenge.atStake : `${currentProgress}/${required} · +1`}
          </div>
        )}
      </div>
    </div>
  );

  /** Franja de color con el emblema de la categoría, como en el imprimible. */
  const Stripe = () => (
    <div
      className="w-9 self-stretch rounded-md flex items-center justify-center text-[#fff] shrink-0"
      style={{ backgroundColor: cat.hex }}
    >
      {isFinal ? <Trophy className="w-4 h-4" /> : <CategoryEmblemSvg emblem={cat.emblem} className="w-4 h-4" />}
    </div>
  );

  const CardFooter = () => (
    <div className="flex items-center justify-between text-[11px]" style={{ color: CARD.muted }}>
      <span className="flex items-center gap-1.5">
        {m.challenge.difficultyLabel}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full border"
            style={{ borderColor: CARD.gold, backgroundColor: i < diffLevel ? CARD.gold : 'transparent' }}
          />
        ))}
      </span>
      <span>{titleText}</span>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55 pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg card-perspective">
        <div className={`grid card-preserve-3d ${isFlipped ? 'card-flipped' : ''}`}>
          {/* ============ ANVERSO: pregunta y opciones (tarjeta imprimible) ============ */}
          <div
            className="col-start-1 row-start-1 card-face rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: CARD.paper, color: CARD.navy }}
          >
            <CardHeader />
            {timed && (
              <div className="px-5 pt-4">
                <ChallengeTimer
                  key={question.id}
                  seconds={TIMED_SECONDS[question.difficulty] ?? 30}
                  running={!isFlipped && !paused}
                  label={m.challenge.timeLeft}
                  onTimeUp={onTimeUp}
                />
              </div>
            )}
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div className="flex gap-3.5">
                <Stripe />
                <div className="flex-1 min-w-0">
                  <p className="text-base sm:text-lg font-semibold leading-snug mb-3.5">{question.prompt}</p>
                  <div className="space-y-1.5">
                    {question.options.map((optionText, idx) => {
                      const isPicked = selectedIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={player.isCpu || isFlipped}
                          onClick={() => onSelectAnswer(idx)}
                          className="w-full flex items-baseline gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors hover:bg-black/[0.035] disabled:hover:bg-transparent"
                          style={{
                            borderColor: isPicked ? CARD.gold : CARD.line,
                            backgroundColor: isPicked ? 'rgba(213,165,60,0.14)' : undefined,
                          }}
                        >
                          <span className="text-sm font-bold w-4 shrink-0" style={{ color: cat.darkHex }}>
                            {OPTION_LETTERS[idx]}
                          </span>
                          <span className="text-sm leading-snug" style={{ color: CARD.text }}>
                            {optionText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="pt-2.5 border-t" style={{ borderColor: CARD.line }}>
                <div className="text-xs mb-1.5" style={{ color: CARD.muted }}>
                  {player.isCpu ? m.challenge.cpuChoosing(player.name) : m.challenge.selectOption}
                </div>
                <CardFooter />
              </div>
            </div>
          </div>

          {/* ============ REVERSO: respuesta y explicación (tarjeta imprimible) ============ */}
          <div
            className="col-start-1 row-start-1 card-face card-face-back rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: CARD.paper, color: CARD.navy }}
          >
            <CardHeader back />
            <div className="p-5 flex-1 flex flex-col gap-4">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#fff]"
                style={{ backgroundColor: isCorrect ? '#6b7a24' : '#a00066' }}
              >
                {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {isCorrect ? m.challenge.correct : timedOut ? m.challenge.timeUp : m.challenge.wrong}
                {!isCorrect && selectedIdx !== null && selectedIdx !== undefined && selectedIdx >= 0 && (
                  <span className="font-normal opacity-90">
                    · {OPTION_LETTERS[selectedIdx]} {question.options[selectedIdx]}
                  </span>
                )}
              </div>
              <div className="flex gap-3.5">
                <Stripe />
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-2" style={{ color: CARD.muted }}>{question.prompt}</p>
                  <p className="text-base font-bold leading-snug mb-1.5" style={{ color: cat.darkHex }}>
                    <span className="mr-2">{OPTION_LETTERS[correctIdx]}</span>
                    {question.options[correctIdx]}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: CARD.text }}>{question.explanation}</p>
                </div>
              </div>
              <div className="pt-3 border-t flex items-center justify-between gap-3" style={{ borderColor: CARD.line }}>
                <div className="text-xs font-medium" style={{ color: CARD.navy }}>{ruleOutcomeText}</div>
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
                  <span className="text-xs whitespace-nowrap shrink-0" style={{ color: CARD.muted }}>
                    {m.challenge.continuing}
                  </span>
                )}
              </div>
              <CardFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
