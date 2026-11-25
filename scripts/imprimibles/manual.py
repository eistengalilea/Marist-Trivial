"""Manual de instrucciones de la versión en papel (HTML A4 que render_manual.cjs pasa a PDF)."""
import os, re, math
from common import *
import cards
from manual_text import TXT

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))


def svg(w, h, body, style=''):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" style="{style}">{body}</svg>'


def board_svg(lang, slug):
    s = open(os.path.join(ROOT, 'public', 'imprimibles', lang, slug + '.svg')).read()
    s = re.sub(r'<style>.*?</style>', '', s, count=1, flags=re.S)
    return s.replace('width="400mm" height="400mm"', 'style="width:100%;height:auto;display:block"', 1)


def chip(color, kind, size=9):
    c = CATS[color]
    return svg(24, 24, f'<rect x="1" y="1" width="22" height="22" rx="4" fill="{c["hex"]}"/>'
               + emblem(c['emblem'], 12, 12, 13, '#FFFFFF'), f'width:{size}mm;height:{size}mm')


def space_icon(kind):
    if kind == 'hub':
        b = f'<circle cx="12" cy="12" r="11" fill="{NAVY}" stroke="{GOLD}" stroke-width="1.2"/>' + symbol(12, 12, 12, '#FFFFFF')
    elif kind == 'hq':
        b = (f'<rect x="1" y="1" width="22" height="22" rx="3" fill="{CATS["blue"]["hex"]}"/>'
             f'<circle cx="12" cy="12" r="7.5" fill="{NAVY}" stroke="#FFFFFF" stroke-width="1"/>'
             + emblem('compass', 12, 12, 9, '#FFFFFF'))
    elif kind == 'cat':
        b = (f'<rect x="1" y="1" width="22" height="22" rx="3" fill="{CATS["pink"]["hex"]}"/>'
             f'<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#FFFFFF" stroke-width="0.8"/>'
             + emblem('diamond', 12, 12, 10, '#FFFFFF'))
    else:
        b = (f'<rect x="1" y="1" width="22" height="22" rx="3" fill="{IVORY}" stroke="{GOLD}" stroke-width="1.2"/>'
             + die_icon(9, 10, 8, NAVY, '#FFFFFF') + die_icon(15.5, 15, 7, NAVY, '#FFFFFF'))
    return svg(24, 24, b, 'width:11mm;height:11mm')


def card(n, back=False):
    body = cards.back(n)[0] if back else cards.front(n)
    return svg(cards.CW, cards.CH, body, 'width:100%;height:auto;display:block')


CSS = f"""
@page {{ size: 210mm 297mm; margin: 0 }}
* {{ box-sizing: border-box }}
html, body {{ margin: 0; font-family: Roboto, Arial, sans-serif; color: #2b2540; font-size: 10.2pt; line-height: 1.42 }}
.m {{ font-family: Montserrat, Arial, sans-serif }}
.page {{ width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; padding: 22mm 18mm 18mm }}
.page:last-child {{ page-break-after: auto }}
.top {{ position: absolute; top: 0; left: 0; right: 0; height: 11mm; background: {NAVY}; display: flex; align-items: center; padding: 0 18mm; gap: 3mm; color: #fff }}
.top .t {{ font-family: Montserrat; font-weight: 800; font-size: 9pt; letter-spacing: .06em }}
.top .s {{ margin-left: auto; font-family: Montserrat; font-weight: 600; font-size: 8pt; color: {GOLD} }}
.pn {{ position: absolute; bottom: 8mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: #8a849c; border-top: .3mm solid #e4dfec; padding-top: 2mm }}
h2 {{ font-family: Montserrat; font-weight: 800; color: {NAVY}; font-size: 17pt; margin: 0 0 3mm; display: flex; align-items: center; gap: 3mm }}
h2 .n {{ display: inline-flex; width: 9mm; height: 9mm; border-radius: 50%; background: {GOLD}; color: {NAVY}; font-size: 12pt; align-items: center; justify-content: center }}
h3 {{ font-family: Montserrat; font-weight: 700; color: {GOLD_D}; font-size: 11pt; margin: 5mm 0 2mm; text-transform: uppercase; letter-spacing: .04em }}
section + section {{ margin-top: 8mm }}
p {{ margin: 0 0 2.4mm }}
ol, ul {{ margin: 0; padding-left: 5.5mm }}
li {{ margin-bottom: 1.8mm }}
li::marker {{ color: {GOLD_D}; font-weight: 700 }}
b {{ color: {NAVY} }}
.grid2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 5mm }}
.box {{ border: .35mm solid #e4dfec; border-radius: 3mm; padding: 3.5mm 4mm; background: #faf8fc }}
.box h4 {{ font-family: Montserrat; font-weight: 700; color: {NAVY}; font-size: 10.5pt; margin: 0 0 1.2mm }}
.row {{ display: flex; gap: 4mm; align-items: flex-start; margin-bottom: 3.2mm }}
.row svg, .row img {{ flex: none }}
table {{ border-collapse: collapse; width: 100% }}
td, th {{ padding: 2mm 2.5mm; text-align: left; vertical-align: middle; border-bottom: .3mm solid #e4dfec }}
th {{ font-family: Montserrat; font-size: 8.5pt; color: {GOLD_D}; text-transform: uppercase; letter-spacing: .04em }}
td.k {{ font-family: Montserrat; font-weight: 700; color: {NAVY}; white-space: nowrap }}
.note {{ font-size: 9pt; color: #6f6589 }}
.ok {{ border-left: 1.6mm solid #6b7a24 }} .ko {{ border-left: 1.6mm solid #a00066 }}
.dice {{ display: grid; grid-template-columns: repeat(6, 1fr); gap: 2mm; margin: 2mm 0 2.4mm }}
.dice div {{ text-align: center; font-size: 8pt; line-height: 1.2 }}
.dice span {{ display: block; font-family: Montserrat; font-weight: 800; font-size: 11pt; color: {NAVY} }}
.cover {{ background: {NAVY}; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20mm }}
.cover .k1 {{ font-family: Montserrat; font-weight: 800; font-size: 34pt; letter-spacing: .05em; margin-top: 10mm }}
.cover .k2 {{ font-family: Montserrat; font-weight: 700; font-size: 18pt; color: {GOLD}; margin-top: 4mm }}
.cover .k3 {{ font-family: Montserrat; font-weight: 500; font-size: 12pt; color: #d9d3e4; margin-top: 2mm }}
.cover .k4 {{ font-size: 10pt; color: #b7aecb; margin-top: 14mm }}
.cover .foot {{ position: absolute; bottom: 14mm; left: 0; right: 0; font-family: Montserrat; font-weight: 600; font-size: 9pt; color: {GOLD} }}
.cover .chips {{ display: flex; gap: 3mm; margin-top: 12mm }}
.toc {{ columns: 2; column-gap: 8mm; margin: 0; padding: 0; list-style: none }}
.toc li {{ display: flex; gap: 2.5mm; margin-bottom: 1.6mm; font-family: Montserrat; font-weight: 600; color: {NAVY}; font-size: 9.5pt }}
.toc li span {{ color: {GOLD_D}; width: 5mm }}
.track td, .track th {{ border: .3mm solid #cfc8db; text-align: center; padding: 3.2mm 1mm }}
.track td.nm {{ text-align: left; width: 38mm }}
.boxes {{ display: inline-flex; gap: 1mm }}
.boxes i {{ width: 4.2mm; height: 4.2mm; border: .35mm solid #8a849c; border-radius: .8mm; display: inline-block }}
.boxes i.w {{ border-radius: 50%; border-color: {GOLD_D}; margin-left: 1mm }}
"""


def head(t, n):
    return (f'<div class="top">{svg(24, 24, symbol(12, 12, 20, "#FFFFFF"), "width:7mm;height:7mm")}'
            f'<span class="t">MARIST TRIVIAL</span><span class="s">{t["page"]}</span></div>'
            f'<div class="pn"><span>{t["foot"]}</span><span>{n}</span></div>')


def H(t, i):
    return f'<h2><span class="n">{i + 1}</span>{t["h"][i]}</h2>'


def build(lang):
    t = TXT[lang]
    set_lang(lang)
    cards.setup(lang)
    cats = DATA['cats'][lang]
    pages = []
    # Portada
    chips = ''.join(chip(c, None, 12) for c in ORDER)
    pages.append(
        f'<div class="page cover">{svg(24, 24, symbol(12, 12, 23, "#FFFFFF"), "width:46mm;height:46mm")}'
        f'<div class="k1">MARIST TRIVIAL</div><div class="k2">{t["doc"]}</div><div class="k3">{t["sub"]}</div>'
        f'<div class="chips">{chips}</div><div class="k4">{t["who"]}</div><div class="foot">{t["foot"]}</div></div>')

    # 2: índice, objetivo, contenido
    toc = ''.join(f'<li><span>{i + 1}</span>{h}</li>' for i, h in enumerate(t['h']))
    thumbs = {
        0: board_svg(lang, 'tablero-cuadrado-blanco'),
        1: card(1),
        2: f'<img src="file://{ROOT}/public/imprimibles/preview/fichas.jpg" style="width:100%;display:block;border-radius:1mm">',
        3: svg(24, 24, f'<rect x="3" y="1" width="18" height="22" rx="1.5" fill="{NAVY}"/>' + symbol(12, 10, 9, '#FFFFFF')
               + f'<rect x="7" y="17" width="10" height="1.2" fill="{GOLD}"/>', 'width:100%;height:auto;display:block'),
    }
    items = ''.join(
        f'<div class="row"><div style="width:22mm">{thumbs[i]}</div><div><h4 class="m" style="margin:0 0 1mm;color:{NAVY};font-size:10.5pt">{a}</h4>{b}</div></div>'
        for i, (a, b) in enumerate(t['contents']))
    pages.append(
        f'<div class="page">{head(t, 2)}<section><h3 style="margin-top:0">{t["toc"]}</h3><ul class="toc">{toc}</ul></section>'
        f'<section>{H(t, 0)}<p style="font-size:11pt">{t["goal"]}</p></section>'
        f'<section>{H(t, 1)}{items}<p class="note">{t["need"]}</p></section></div>')

    # 3: preparación
    pa = ''.join(f'<li>{x}</li>' for x in t['prep_a_items'])
    pb = ''.join(f'<li>{x}</li>' for x in t['prep_b_items'])
    pages.append(
        f'<div class="page">{head(t, 3)}<section>{H(t, 2)}<h3>{t["prep_a"]}</h3><ol>{pa}</ol>'
        f'<h3>{t["prep_b"]}</h3><ol>{pb}</ol></section>'
        f'<div class="grid2" style="margin-top:8mm;align-items:end">'
        f'<div>{board_svg(lang, "tablero-circular-blanco")}</div>'
        f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm">{card(1)}{card(1, True)}'
        f'<div class="note" style="grid-column:span 2;text-align:center">{t["card_cap"]}</div></div></div></div>')

    # 4: tablero
    sp = ''.join(f'<div class="row">{space_icon(k)}<div><b>{a}</b><br>{b}</div></div>' for k, a, b in t['spaces'])
    ct = ''.join(f'<tr><td style="width:12mm">{chip(c, None, 8)}</td><td class="k">{cats[c]["color"]}</td><td>{cats[c]["name"]}</td></tr>' for c in ORDER)
    pages.append(
        f'<div class="page">{head(t, 4)}<section>{H(t, 3)}<p>{t["board_intro"]}</p>'
        f'<div class="grid2" style="grid-template-columns:78mm 1fr;align-items:start;margin-top:3mm">'
        f'<div>{board_svg(lang, "tablero-cuadrado-blanco")}</div><div>{sp}</div></div>'
        f'<p style="margin-top:4mm">{t["cats_intro"]}</p><table>{ct}</table></section></div>')

    # 5: cómo se juega
    ti = ''.join(f'<li>{x}</li>' for x in t['turn_items'])
    pages.append(
        f'<div class="page">{head(t, 5)}<section>{H(t, 4)}<h3>{t["turn"]}</h3><ol>{ti}</ol>'
        f'<h3>{t["ask"]}</h3><div class="grid2" style="grid-template-columns:1fr 84mm;align-items:start">'
        f'<div><p>{t["ask_body"]}</p><div class="box ok" style="margin-top:4mm"><h4>{t["ok"]}</h4>{t["ok_body"]}</div>'
        f'<div class="box ko" style="margin-top:3mm"><h4>{t["ko"]}</h4>{t["ko_body"]}</div></div>'
        f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:2mm">{card(2)}{card(2, True)}'
        f'<div class="note" style="grid-column:span 2;text-align:center">{t["card_cap"]}</div></div></div></section></div>')

    # 6: quesitos y victoria + 7: modos
    dr = ''.join(f'<tr><td class="k">{a}</td><td><b>{b}</b></td><td>{c}</td></tr>' for a, b, c in t['dur_rows'])
    dh = ''.join(f'<th>{x}</th>' for x in t['dur_head'])
    wb = ''.join(f'<p>{x}</p>' for x in t['wedge_body'])
    dice = ''.join(f'<div>{chip(c, None, 9)}<span>{i + 1}</span>{cats[c]["color"]}</div>' for i, c in enumerate(ORDER))
    fi = t['final_items']
    pie = svg(24, 24, f'<circle cx="12" cy="12" r="11.6" fill="#fff" stroke="{NAVY}" stroke-width=".6"/>' + ''.join(
        f'<path d="{wedge_path(12, 12, 2.2, 11, math.radians(-90 + k * 60), math.radians(28))}" fill="{CATS[c]["hex"]}"/>' for k, c in enumerate(ORDER)), 'width:26mm;height:26mm;flex:none')
    pages.append(
        f'<div class="page">{head(t, 6)}<section>{H(t, 5)}<div class="row" style="gap:6mm">{pie}<div>{wb}</div></div>'
        f'<h3>{t["final"]}</h3><ol><li>{fi[0]}</li><li>{fi[1]}<div class="dice">{dice}</div></li><li>{fi[2]}</li></ol></section>'
        f'<section>{H(t, 6)}<h3>{t["dur"]}</h3><p>{t["dur_intro"]}</p><table><tr>{dh}</tr>{dr}</table></section></div>')

    lr = ''.join(f'<tr><td class="k">{a}</td><td>{b}</td><td class="note">{c}</td></tr>' for a, b, c in t['lvl_rows'])
    va = ''.join(f'<div class="box"><h4>{a}</h4>{b}</div>' for a, b in t['variants'])
    pages.append(
        f'<div class="page">{head(t, 7)}<section><h3 style="margin-top:0">{t["lvl"]}</h3><p>{t["lvl_intro"]}</p><table>{lr}</table><p class="note" style="margin-top:2mm">{t["lvl_note"]}</p></section>'
        f'<section>{H(t, 7)}<p>{t["var_intro"]}</p><div class="grid2">{va}</div></section></div>')

    # 8: resumen + hoja de seguimiento
    su = ''.join(f'<li>{x}</li>' for x in t['summary'])
    th = ''.join(f'<th>{chip(c, None, 7)}</th>' for c in ORDER)
    cell = '<td><span class="boxes"><i></i><i></i><i></i><i></i><i class="w"></i></span></td>'
    rows = ''.join(
        f'<tr><td class="nm"><span style="display:inline-block;width:3.2mm;height:3.2mm;border-radius:50%;background:{PLAYERS[k]};border:.3mm solid #8a849c;vertical-align:middle;margin-right:2mm"></span></td>{cell * 6}</tr>'
        for k in range(6))
    pages.append(
        f'<div class="page">{head(t, 8)}<section>{H(t, 8)}<div class="box"><ol>{su}</ol></div></section>'
        f'<section>{H(t, 9)}<p>{t["track_note"]}</p><table class="track"><tr><th style="text-align:left">{t["name"]}</th>{th}</tr>{rows}</table></section></div>')

    return f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><title>Marist Trivial · {t["doc"]}</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'


if __name__ == '__main__':
    import sys, json
    out_dir = sys.argv[1]
    jobs = []
    for lang in ['es', 'pt', 'gl']:
        tmp = os.path.join(CACHE, 'tmp', lang); os.makedirs(tmp, exist_ok=True)
        h = os.path.join(tmp, 'manual.html')
        open(h, 'w').write(build(lang))
        job = dict(html=h, pdf=os.path.join(out_dir, lang, 'manual.pdf'))
        if lang == 'es' and len(sys.argv) > 2: job['png'] = os.path.join(sys.argv[2], 'manual.png')
        jobs.append(job)
    json.dump(jobs, open(os.path.join(CACHE, 'manual_jobs.json'), 'w'))
    print(len(jobs), 'manuales')
