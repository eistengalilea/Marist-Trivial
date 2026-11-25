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

TOP, BOTTOM = 14.2, CH - 9.2
ROW = (BOTTOM - TOP) / 6
X0 = 13.6
COLW = CW - X0 - 4.6
IND = 2.9  # sangría del texto de cada opción tras su letra

def stripe(o, y, h, cat):
    c = CATS[cat]
    o.append(f'<rect x="4" y="{y:.2f}" width="7" height="{h:.2f}" rx="1.2" fill="{c["hex"]}"/>')
    o.append(emblem(c['emblem'], 7.5, y + h/2, 4.4, '#FFFFFF'))

def row_frame(o, k, cat):
    y = TOP + k*ROW
    if k: o.append(f'<line x1="4" y1="{y:.2f}" x2="{CW-4}" y2="{y:.2f}" stroke="{NAVY}" stroke-opacity="0.12" stroke-width="0.25"/>')
    stripe(o, y + 1.1, ROW - 2.2, cat)
    return y

def opt(o, x, y, letter, lines, size, lh, col):
    o.append(f'<text x="{x:.2f}" y="{y:.2f}" class="r" font-size="{size:.2f}" font-weight="700" fill="{col}">{letter}</text>')
    o.append(tlines(x + IND*size/2.4, y, lines, size, lh, 'r', 400, '#3a3550'))

def front_block(q, scale):
    qs, op = 7.4*PT*scale, 6.8*PT*scale
    ql = wrap(q['prompt'], 'Roboto', 'SemiBold', qs, COLW)
    ind = IND*op/2.4
    half = (COLW - 2) / 2
    two = all(text_w(t, 'Roboto', 'Regular', op) <= half - ind for t in q['options'])
    if two:
        rows = None; oh = 2
    else:
        rows = [wrap(t, 'Roboto', 'Regular', op, COLW - ind) for t in q['options']]
        oh = sum(len(r) for r in rows)
    h = qs*0.95 + (len(ql)-1)*qs*1.2 + 2.0 + op*0.8 + (oh-1)*op*1.25 + op*0.25
    return dict(ql=ql, two=two, rows=rows, h=h, qs=qs, op=op)

def front(n):
    qs = [by[c][n-1] for c in ORDER]
    o = header(n)
    for k, q in enumerate(qs):
        y = row_frame(o, k, q['color'])
        scale = 1.0
        b = front_block(q, scale)
        while b['h'] > ROW - 2.6 and scale > 0.78:
            scale -= 0.02; b = front_block(q, scale)
        top = y + (ROW - b['h'])/2
        col = CATS[q['color']]['dark']
        yy = top + b['qs']*0.95
        o.append(tlines(X0, yy, b['ql'], b['qs'], b['qs']*1.2, 'r', 600, NAVY))
        yy += (len(b['ql'])-1)*b['qs']*1.2 + 2.0 + b['op']*0.8
        if b['two']:
            for r in range(2):
                for c in range(2):
                    i = r*2 + c
                    opt(o, X0 + c*(COLW+2)/2, yy, 'ABCD'[i], [q['options'][i]], b['op'], 0, col)
                yy += b['op']*1.25
        else:
            for i, lines in enumerate(b['rows']):
                opt(o, X0, yy, 'ABCD'[i], lines, b['op'], b['op']*1.25, col)
                yy += len(lines)*b['op']*1.25
    footer(o, round(sum(DIFF[q['difficulty']] for q in qs)/6))
    o.append(f'<rect x="0.15" y="0.15" width="{CW-0.3}" height="{CH-0.3}" rx="3.5" fill="none" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.3"/>')
    return ''.join(o)

def back_block(q, scale):
    a, e = 7.6*PT*scale, 6.3*PT*scale
    letter = 'ABCD'[q['correctIndex']]
    al = wrap(q['options'][q['correctIndex']], 'Roboto', 'Bold', a, COLW - IND*a/2.4)
    el = wrap(q['explanation'], 'Roboto', 'Regular', e, COLW)
    h = a*0.95 + (len(al)-1)*a*1.2 + 1.6 + e*0.8 + (len(el)-1)*e*1.3 + e*0.25
    return dict(letter=letter, al=al, el=el, a=a, e=e, h=h)

def back(n):
    qs = [by[c][n-1] for c in ORDER]
    o = header(n, back=True)
    worst = 99
    for k, q in enumerate(qs):
        y = row_frame(o, k, q['color'])
        scale = 1.0; b = back_block(q, scale)
        while b['h'] > ROW - 2.6 and scale > 0.78:
            scale -= 0.02; b = back_block(q, scale)
        worst = min(worst, ROW - b['h'])
        top = y + (ROW - b['h'])/2
        col = CATS[q['color']]['dark']
        yy = top + b['a']*0.95
        o.append(f'<text x="{X0}" y="{yy:.2f}" class="r" font-size="{b["a"]:.2f}" font-weight="700" fill="{col}">{b["letter"]}</text>')
        o.append(tlines(X0 + IND*b['a']/2.4, yy, b['al'], b['a'], b['a']*1.2, 'r', 700, col))
        yy += (len(b['al'])-1)*b['a']*1.2 + 1.6 + b['e']*0.8
        o.append(tlines(X0, yy, b['el'], b['e'], b['e']*1.3, 'r', 400, '#4a4560'))
    footer(o, round(sum(DIFF[q['difficulty']] for q in qs)/6))
    o.append(f'<rect x="0.15" y="0.15" width="{CW-0.3}" height="{CH-0.3}" rx="3.5" fill="none" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.3"/>')
    return ''.join(o), worst

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

def ncards():
    return min(len(by[c]) for c in ORDER)

def check():
    bad = []
    for n in range(1, ncards() + 1):
        for q in [by[c][n-1] for c in ORDER]:
            for fn in (front_block, back_block):
                b = fn(q, 0.78)
                if b['h'] > ROW - 1.2: bad.append((n, q['id'], fn.__name__, round(b['h'], 1)))
    return bad

def sheets():
    """Devuelve lista de (nombre, svg): una hoja (2 caras) por cada 4 tarjetas."""
    out = []
    for k in range((ncards() + 3) // 4):
        nums = list(range(k*4+1, min(k*4+5, ncards()+1)))
        out.append((f'{k+1:02d}a', svg_doc(AW, AH, sheet(nums, False), f'Marist Trivial · {t["cards"]} {nums[0]:02d}-{nums[-1]:02d} · A')))
        out.append((f'{k+1:02d}b', svg_doc(AW, AH, sheet(nums, True), f'Marist Trivial · {t["cards"]} {nums[0]:02d}-{nums[-1]:02d} · B')))
    return out
