import React, { useEffect, useRef, useState } from 'react';
import { Timer } from 'lucide-react';

interface ChallengeTimerProps {
  /** Segundos disponibles para esta pregunta. */
  seconds: number;
  /** El tiempo solo corre mientras la pregunta está a la vista y la partida no está en pausa. */
  running: boolean;
  label: string;
  onTimeUp: () => void;
}

/**
 * Cronómetro del modo Contrarreloj. Se monta con una `key` por pregunta, así
 * que cada tarjeta empieza con el tiempo completo. Al pausar conserva lo que queda.
 */
export const ChallengeTimer: React.FC<ChallengeTimerProps> = ({ seconds, running, label, onTimeUp }) => {
  const total = seconds * 1000;
  const [left, setLeft] = useState(total);
  const leftRef = useRef(total);
  const firedRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (!running || firedRef.current) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      leftRef.current = Math.max(0, leftRef.current - (now - last));
      last = now;
      setLeft(leftRef.current);
      if (leftRef.current <= 0 && !firedRef.current) {
        firedRef.current = true;
        window.clearInterval(id);
        onTimeUpRef.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);

  const secs = Math.ceil(left / 1000);
  const frac = left / total;
  const urgent = secs <= 5;
  const color = urgent ? '#a00066' : '#D5A53C';

  return (
    <div className="flex items-center gap-2.5" role="timer" aria-live="off" aria-label={`${label}: ${secs} s`}>
      <Timer className={`w-4 h-4 shrink-0 ${urgent && running ? 'animate-pulse' : ''}`} style={{ color }} />
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(49, 42, 78, 0.12)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${frac * 100}%`, backgroundColor: color, transition: 'width 100ms linear' }}
        />
      </div>
      <span className="font-mono-tabular text-sm font-bold w-10 text-right" style={{ color: urgent ? color : '#312A4E' }}>
        {secs} s
      </span>
    </div>
  );
};
