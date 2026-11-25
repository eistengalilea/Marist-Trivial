import React from 'react';
import { X, Download, FileText, Image as ImageIcon, BookOpen } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

/**
 * Descargas para jugar en papel. Los archivos se generan con
 * `scripts/imprimibles` y viven en `public/imprimibles/<idioma>/`.
 */
interface PrintablesModalProps {
  open: boolean;
  onClose: () => void;
}

const FileLink: React.FC<{ href: string; label: string; kind: 'pdf' | 'svg' }> = ({ href, label, kind }) => (
  <a
    href={href}
    download
    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/6 border border-white/10 hover:border-gold-400/60 hover:bg-white/10 text-[11px] font-medium text-ink-100 transition-colors"
  >
    {kind === 'pdf' ? (
      <FileText className="w-3.5 h-3.5 text-gold-400" />
    ) : (
      <ImageIcon className="w-3.5 h-3.5 text-ink-300" />
    )}
    {label}
  </a>
);

export const PrintablesModal: React.FC<PrintablesModalProps> = ({ open, onClose }) => {
  const { lang, m } = useI18n();
  const p = m.printables;
  if (!open) return null;

  const base = `${import.meta.env.BASE_URL}imprimibles/${lang}/`;
  const thumbs = `${import.meta.env.BASE_URL}imprimibles/preview/`;

  const boards: { slug: string; label: string }[] = [
    { slug: 'tablero-cuadrado-blanco', label: `${p.square} · ${p.light}` },
    { slug: 'tablero-cuadrado-oscuro', label: `${p.square} · ${p.dark}` },
    { slug: 'tablero-circular-blanco', label: `${p.circle} · ${p.light}` },
    { slug: 'tablero-circular-oscuro', label: `${p.circle} · ${p.dark}` },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printables-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-panel border border-white/12 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 id="printables-modal-title" className="text-xl font-semibold text-ink-50 tracking-tight">
              {p.title}
            </h2>
            <p className="text-xs text-ink-400 mt-0.5">
              {p.subtitle} · {p.langNote}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-ink-400 hover:text-white hover:bg-white/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            aria-label={p.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gold-400 uppercase tracking-wide">
              <Download className="w-4 h-4" /> {p.board}
            </h3>
            <p className="text-xs text-ink-300 mt-1">{p.boardNote}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {boards.map((b) => (
                <div key={b.slug} className="rounded-lg border border-white/10 bg-white/4 p-2 flex flex-col gap-2">
                  <img
                    src={`${thumbs}${b.slug}.jpg`}
                    alt=""
                    loading="lazy"
                    className="w-full aspect-square object-cover rounded"
                  />
                  <div className="text-[11px] font-medium text-ink-100 leading-tight">{b.label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <FileLink href={`${base}${b.slug}.pdf`} label="PDF" kind="pdf" />
                    <FileLink href={`${base}${b.slug}-A4.pdf`} label={p.a4} kind="pdf" />
                    <FileLink href={`${base}${b.slug}.svg`} label="SVG" kind="svg" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/4 p-3 flex gap-3">
              <img src={`${thumbs}tarjetas.jpg`} alt="" loading="lazy" className="w-24 h-auto self-start rounded" />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wide">{p.cards}</h3>
                <p className="text-xs text-ink-300">{p.cardsNote}</p>
                <div className="flex flex-wrap gap-1.5">
                  <FileLink href={`${base}tarjetas.pdf`} label="PDF" kind="pdf" />
                  <FileLink href={`${base}tarjetas-svg.zip`} label={p.svgZip} kind="svg" />
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/4 p-3 flex gap-3">
              <img src={`${thumbs}fichas.jpg`} alt="" loading="lazy" className="w-24 h-auto self-start rounded" />
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wide">{p.tokens}</h3>
                <p className="text-xs text-ink-300">{p.tokensNote}</p>
                <div className="flex flex-wrap gap-1.5">
                  <FileLink href={`${base}fichas.pdf`} label="PDF" kind="pdf" />
                  <FileLink href={`${base}fichas-hoja-1.svg`} label={`SVG · ${p.sheet(1)}`} kind="svg" />
                  <FileLink href={`${base}fichas-hoja-2.svg`} label={`SVG · ${p.sheet(2)}`} kind="svg" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/4 p-3 flex gap-3">
            <img src={`${thumbs}manual.jpg`} alt="" loading="lazy" className="w-24 h-auto self-start rounded" />
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gold-400 uppercase tracking-wide">
                <BookOpen className="w-4 h-4" /> {p.manual}
              </h3>
              <p className="text-xs text-ink-300">{p.manualNote}</p>
              <div className="flex flex-wrap gap-1.5">
                <FileLink href={`${base}manual.pdf`} label="PDF" kind="pdf" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
