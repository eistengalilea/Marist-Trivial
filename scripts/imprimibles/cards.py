from common import *
import sys

CW, CH = 90, 140
by = {}
t = T['es']
def setup(lang):
    global t
    t = T[lang]
    set_lang(lang)
    Q = questions(lang)
    for c in ORDER: by[c] = [q for q in Q if q['color'] == c]
DIFF = {'easy': 1, 'medium': 2, 'hard': 3}
PT = 0.3528

def header(n, back=False):
    o = []
    bg = GOLD if back else NAVY
    fg = NAVY if back else '#FFFFFF'
    o.append(f'<rect width="{CW}" height="{CH}" rx="3.5" fill="#FFFFFF"/>')
    o.append(f'<path d="M0 3.5 A3.5 3.5 0 0 1 3.5 0 H{CW-3.5} A3.5 3.5 0 0 1 {CW} 3.5 V13 H0 Z" fill="{bg}"/>')
    o.append(symbol(9, 6.5, 7.2, fg))
    o.append(f'<text x="15" y="6" class="m" font-size="3.4" font-weight="800" fill="{fg}">MARIST TRIVIAL</text>')
    sub = t['a'] if back else t['q']
    o.append(f'<text x="15" y="10" class="m" font-size="2.4" font-weight="600" fill="{fg}" letter-spacing="0.4" opacity="0.85">{sub}</text>')
    o.append(f'<text x="{CW-5}" y="9.6" class="m" font-size="6" font-weight="800" fill="{GOLD if not back else NAVY}" text-anchor="end">{n:02d}</text>')
    o.append(f'<text x="{CW-15.5}" y="9.4" class="m" font-size="2" font-weight="600" fill="{fg}" text-anchor="end" opacity="0.8">Nº</text>')
    return o

def footer(o, diff):
    y = CH - 4.2
    o.append(f'<line x1="5" y1="{CH-7.5}" x2="{CW-5}" y2="{CH-7.5}" stroke="{NAVY}" stroke-opacity="0.15" stroke-width="0.3"/>')
    o.append(f'<text x="5" y="{y}" class="r" font-size="2.2" fill="{NAVY}" opacity="0.7">{t["diff"]}</text>')
    for i in range(3):
        o.append(f'<circle cx="{8.2 + text_w(t['diff'],'Roboto','Regular',2.2) + i*3}" cy="{y-0.75}" r="0.95" fill="{GOLD if i < diff else "none"}" stroke="{GOLD}" stroke-width="0.35"/>')
    o.append(f'<text x="{CW-5}" y="{y}" class="r" font-size="2.2" fill="{NAVY}" opacity="0.7" text-anchor="end">{t['foot']}</text>')

def stripe(o, y, h, cat):
    c = CATS[cat]
    o.append(f'<rect x="4" y="{y}" width="7" height="{h}" rx="1.2" fill="{c["hex"]}"/>')
    o.append(emblem(c['emblem'], 7.5, y + 4.2, 4.4, '#FFFFFF'))

def layout_front(qs, scale):
    qs_size, op_size = 7.6*PT*scale, 6.9*PT*scale
    x0, colw = 13.5, CW - 13.5 - 4.5
    blocks = []
    for q in qs:
        ql = wrap(q['prompt'], 'Roboto', 'SemiBold', qs_size, colw)
        opts = [f'{"ABCD"[i]}  {t}' for i, t in enumerate(q['options'])]
        half = (colw - 2) / 2
        two = all(text_w(t, 'Roboto', 'Regular', op_size) <= half for t in opts)
        if two:
            rows = [[[opts[0]], [opts[1]]], [[opts[2]], [opts[3]]]]
            oh = 2
        else:
            rows = [wrap(t, 'Roboto', 'Regular', op_size, colw) for t in opts]
            oh = sum(len(r) for r in rows)
        h = len(ql)*qs_size*1.22 + 0.9 + oh*op_size*1.28 + 0.3
        blocks.append((q, ql, two, rows, max(h, 8.6)))
    return blocks, qs_size, op_size, x0, colw

def front(n):
    qs = [by[c][n-1] for c in ORDER]
    o = header(n)
    avail = CH - 13 - 9 - 2
    scale = 1.0
    while True:
        blocks, qs_size, op_size, x0, colw = layout_front(qs, scale)
        total = sum(b[4] for b in blocks)
        gap = (avail - total) / 6
        if gap >= 1.2 or scale < 0.7: break
        scale -= 0.03
    y = 15.2
    for (q, ql, two, rows, h) in blocks:
        stripe(o, y, h, q['color'])
        yy = y + qs_size*0.95
        o.append(tlines(x0, yy, ql, qs_size, qs_size*1.22, 'r', 600, NAVY))
        yy += len(ql)*qs_size*1.22 + 0.9 - qs_size*0.2 + op_size*0.8
        if two:
            for r in rows:
                o.append(tlines(x0, yy, r[0], op_size, 0, 'r', 400, '#3a3550'))
                o.append(tlines(x0 + (colw+2)/2, yy, r[1], op_size, 0, 'r', 400, '#3a3550'))
                yy += op_size*1.28
        else:
            for r in rows:
                o.append(tlines(x0, yy, r, op_size, op_size*1.28, 'r', 400, '#3a3550'))
                yy += len(r)*op_size*1.28
        y += h + gap
    footer(o, round(sum(DIFF[q['difficulty']] for q in qs)/6))
    o.append(f'<rect x="0.15" y="0.15" width="{CW-0.3}" height="{CH-0.3}" rx="3.5" fill="none" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.3"/>')
    return ''.join(o)

def back(n):
    qs = [by[c][n-1] for c in ORDER]
    o = header(n, back=True)
    a_size, e_size = 7.8*PT, 6.4*PT
    x0, colw = 13.5, CW - 13.5 - 4.5
    blocks = []
    for q in qs:
        ans = f'{"ABCD"[q["correctIndex"]]} · {q["options"][q["correctIndex"]]}'
        al = wrap(ans, 'Roboto', 'Bold', a_size, colw)
        el = wrap(q['explanation'], 'Roboto', 'Regular', e_size, colw)
        h = len(al)*a_size*1.22 + 0.8 + len(el)*e_size*1.3
        blocks.append((q, al, el, max(h, 8.6)))
    gap = (CH - 13 - 9 - 2 - sum(b[3] for b in blocks)) / 6
    y = 15.2
    for q, al, el, h in blocks:
        stripe(o, y, h, q['color'])
        yy = y + a_size*0.95
        o.append(tlines(x0, yy, al, a_size, a_size*1.22, 'r', 700, CATS[q['color']]['dark']))
        yy += len(al)*a_size*1.22 + 0.8 - a_size*0.2 + e_size*0.8
        o.append(tlines(x0, yy, el, e_size, e_size*1.3, 'r', 400, '#4a4560'))
        y += h + gap
    footer(o, round(sum(DIFF[q['difficulty']] for q in qs)/6))
    o.append(f'<rect x="0.15" y="0.15" width="{CW-0.3}" height="{CH-0.3}" rx="3.5" fill="none" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.3"/>')
    return ''.join(o), gap

# muestra: tarjeta 1 suelta + hoja A4 con tarjetas 1-4 (anverso y reverso espejado)
def crop(o, x, y):
    for (cx, cy) in [(x, y), (x+CW, y), (x, y+CH), (x+CW, y+CH)]:
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            pass
    return o

AW, AH = 210, 297
mx, my = (AW - 2*CW - 6)/2, (AH - 2*CH - 6)/2
def sheet(nums, backside):
    o = [f'<rect width="{AW}" height="{AH}" fill="#FFFFFF"/>']
    for i, n in enumerate(nums):
        col, row = i % 2, i // 2
        if backside: col = 1 - col  # espejo para imprimir a doble cara (borde largo)
        x, y = mx + col*(CW+6), my + row*(CH+6)
        body = back(n)[0] if backside else front(n)
        o.append(f'<g transform="translate({x:.2f} {y:.2f})">{body}</g>')
        for (cx, cy) in [(x, y), (x+CW, y), (x, y+CH), (x+CW, y+CH)]:
            sx = -1 if cx == x else 1; sy = -1 if cy == y else 1
            o.append(f'<line x1="{cx:.2f}" y1="{cy+sy*1:.2f}" x2="{cx:.2f}" y2="{cy+sy*4:.2f}" stroke="#999" stroke-width="0.2"/>')
            o.append(f'<line x1="{cx+sx*1:.2f}" y1="{cy:.2f}" x2="{cx+sx*4:.2f}" y2="{cy:.2f}" stroke="#999" stroke-width="0.2"/>')
    lab = t['sideB'] if backside else t['sideA']
    o.append(f'<text x="{AW/2}" y="{AH-3}" class="r" font-size="2.4" fill="#888" text-anchor="middle">Marist Trivial · {t['cards']} {nums[0]:02d}–{nums[-1]:02d} · {lab}</text>')
    return ''.join(o)

def check():
    bad = []
    for n in range(1, 21):
        blocks, *_ = layout_front([by[c][n-1] for c in ORDER], 1.0)
        fgap = (CH-24-sum(b[4] for b in blocks))/6
        bgap = back(n)[1]
        if fgap < 1.2 or bgap < 0.8: bad.append((n, round(fgap,2), round(bgap,2)))
    return bad

def sheets():
    """Devuelve lista de (nombre, svg) con 5 hojas × 2 caras."""
    out = []
    for k in range(5):
        nums = list(range(k*4+1, k*4+5))
        out.append((f'{k+1}a', svg_doc(AW, AH, sheet(nums, False), f'Marist Trivial · {t["cards"]} {nums[0]:02d}-{nums[-1]:02d} · A')))
        out.append((f'{k+1}b', svg_doc(AW, AH, sheet(nums, True), f'Marist Trivial · {t["cards"]} {nums[0]:02d}-{nums[-1]:02d} · B')))
    return out
