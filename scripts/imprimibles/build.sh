#!/usr/bin/env bash
# Genera los materiales imprimibles (tablero, tarjetas, fichas y manual) en ES, PT y GL
# dentro de public/imprimibles/. Requisitos: Node 22+, Python 3 con Pillow y
# Playwright con Chromium (`npm i -D playwright && npx playwright install chromium`).
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(cd ../.. && pwd)"
CACHE=.cache
mkdir -p "$CACHE/fonts"
# Tipografías del manual de MarCha (Google Fonts, licencia OFL)
[ -s "$CACHE/fonts/Montserrat.ttf" ] || curl -sL -o "$CACHE/fonts/Montserrat.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf"
[ -s "$CACHE/fonts/Roboto.ttf" ] || curl -sL -o "$CACHE/fonts/Roboto.ttf" "https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf"
# Chromium debe tener las fuentes instaladas para incrustarlas en los PDF
mkdir -p "$HOME/.fonts" && cp "$CACHE/fonts/"*.ttf "$HOME/.fonts/" && (fc-cache -f >/dev/null 2>&1 || true)

node --experimental-strip-types dump.mjs \
  "$ROOT/src/game/questions.ts" "$ROOT/src/brand/marchaSymbol.ts" \
  "$ROOT/src/i18n/questions.pt.ts" "$ROOT/src/i18n/questions.gl.ts" "$ROOT/src/i18n/messages.ts" > "$CACHE/data.json"
python3 build.py "$ROOT/public/imprimibles" "$CACHE/preview"
node render_jobs.cjs "$CACHE/jobs.json"
# Manual de instrucciones (HTML -> PDF)
python3 manual.py "$ROOT/public/imprimibles" "$CACHE/preview"
node render_manual.cjs "$CACHE/manual_jobs.json"
python3 thumbs.py "$CACHE/preview" "$ROOT/public/imprimibles/preview"
echo "Listo: $ROOT/public/imprimibles"
