from common import *
AW, AH = 210, 297
CUT = 'stroke="#8a8a8a" stroke-width="0.25"'
FOLD = 'stroke="#8a8a8a" stroke-width="0.25" stroke-dasharray="1.2 1"'

def title(o, y, t, sub):
    o.append(f'<text x="15" y="{y}" class="m" font-size="4.6" font-weight="800" fill="{NAVY}">{esc(t)}</text>')
    o.append(f'<text x="15" y="{y+5}" class="r" font-size="2.7" fill="#5a5570">{esc(sub)}</text>')

def page_head(o, n, t):
    o.append(f'<rect width="{AW}" height="{AH}" fill="#FFFFFF"/>')
    o.append(f'<rect width="{AW}" height="16" fill="{NAVY}"/>')
    o.append(symbol(19, 8, 9, '#FFFFFF'))
    o.append(f'<text x="27" y="10.2" class="m" font-size="5" font-weight="800" fill="#FFFFFF">MARIST TRIVIAL</text>')
    o.append(f'<text x="{AW-12}" y="10" class="m" font-size="3.2" font-weight="600" fill="{GOLD}" text-anchor="end">{t["tokens"]} · {t["sheet"]} {n} {t["of"]} 2</text>')
    o.append(f'<text x="{AW/2}" y="{AH-5}" class="r" font-size="2.3" fill="#888" text-anchor="middle">{t["cutnote"]}</text>')

def build(lang):
    t = T[lang]; set_lang(lang)
    o = []; page_head(o, 1, t)
    title(o, 27, t['pawns'], t['pawns_sub'])
    pw, face, tab = 22, 26, 9
    for i, col in enumerate(PLAYERS):
        x = 15 + i*31; y = 36
        # tira: pestaña | cara | cara | base
        segs = [tab, face, face, tab+3]
        o.append(f'<rect x="{x}" y="{y}" width="{pw}" height="{sum(segs)}" fill="none" {CUT}/>')
        yy = y
        for k, h in enumerate(segs):
            if k in (1, 2):
                o.append(f'<rect x="{x}" y="{yy}" width="{pw}" height="{h}" fill="{NAVY}"/>')
                o.append(f'<rect x="{x+1.2}" y="{yy+1.2}" width="{pw-2.4}" height="{h-2.4}" rx="1.5" fill="none" stroke="{col}" stroke-width="0.5"/>')
                rot = 180 if k == 1 else 0
                o.append(f'<g transform="rotate({rot} {x+pw/2} {yy+h/2})">{symbol(x+pw/2, yy+h/2, 17, col)}</g>')
            else:
                o.append(f'<rect x="{x}" y="{yy}" width="{pw}" height="{h}" fill="{col}" fill-opacity="0.25"/>')
                o.append(f'<text x="{x+pw/2}" y="{yy+h/2+0.9}" class="r" font-size="2.2" fill="#666" text-anchor="middle">{t["glue"] if k == 0 else t["base"]}</text>')
            if k: o.append(f'<line x1="{x}" y1="{yy}" x2="{x+pw}" y2="{yy}" {FOLD}/>')
            yy += h
        o.append(f'<rect x="{x}" y="{y}" width="{pw}" height="{sum(segs)}" fill="none" {CUT}/>')

    title(o, 122, t['wheels'], t['wheels_sub'])
    R = 25
    for i, col in enumerate(PLAYERS):
        cx = 15 + R + 2 + (i % 3)*62; cy = 158 + (i // 3)*64
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{R+2.5}" fill="{NAVY}" {CUT}/>')
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{R+1.2}" fill="none" stroke="{col}" stroke-width="0.8"/>')
        for k, cat in enumerate(ORDER):
            a = k*math.pi/3 - math.pi/2
            c = CATS[cat]
            o.append(f'<path d="{wedge_path(cx, cy, 8, R, a, math.pi/6 - 0.03)}" fill="{c["hex"]}" fill-opacity="0.28" stroke="{c["hex"]}" stroke-width="0.45"/>')
            o.append(emblem(c['emblem'], cx + math.cos(a)*17, cy + math.sin(a)*17, 5, c['hex']))
        o.append(f'<circle cx="{cx}" cy="{cy}" r="7.6" fill="{NAVY_DD}" stroke="{col}" stroke-width="0.6"/>')
        o.append(symbol(cx, cy, 9, col))
        pass
    sheet1 = svg_doc(AW, AH, ''.join(o), 'Marist Trivial · ' + t['tokens'] + ' 1')

    # ---------- Hoja 2: quesitos + dado ----------
    o = []; page_head(o, 2, t)
    title(o, 27, t['wedges'], t['wedges_sub'])
    r = 24.2
    for row, cat in enumerate(ORDER):
        c = CATS[cat]; y = 40 + row*25
        o.append(f'<text x="15" y="{y+11}" class="m" font-size="2.6" font-weight="700" fill="{c["dark"]}">{esc(c["short"])}</text>')
        for k in range(6):
            x = 58 + k*23.5
            cy0, a = y + 23.5, -math.pi/2
            o.append(f'<path d="{wedge_path(x, cy0, 7.5, 24, a, math.pi/6 - 0.03)}" fill="{c["hex"]}" {CUT}/>')
            o.append(emblem(c['emblem'], x, cy0 - 16, 5, '#FFFFFF'))

    title(o, 202, t['die'], t['die_sub'])
    s = 18; dx, dy = 70, 214
    faces = {(1,0):1, (0,1):2, (1,1):3, (2,1):5, (3,1):4, (1,2):6}
    PIPS = {1:[(0,0)], 2:[(-1,-1),(1,1)], 3:[(-1,-1),(0,0),(1,1)], 4:[(-1,-1),(1,-1),(-1,1),(1,1)],
            5:[(-1,-1),(1,-1),(0,0),(-1,1),(1,1)], 6:[(-1,-1),(1,-1),(-1,0),(1,0),(-1,1),(1,1)]}
    tabs = [((0,1),'up'),((0,1),'down'),((2,1),'up'),((2,1),'down'),((3,1),'up'),((3,1),'down'),((3,1),'right')]
    for (gx, gy), side in tabs:
        x, y = dx + gx*s, dy + gy*s; tb = 4
        pts = {'up': [(x,y),(x+tb,y-tb),(x+s-tb,y-tb),(x+s,y)], 'down': [(x,y+s),(x+tb,y+s+tb),(x+s-tb,y+s+tb),(x+s,y+s)],
               'right': [(x+s,y),(x+s+tb,y+tb),(x+s+tb,y+s-tb),(x+s,y+s)]}[side]
        o.append(f'<polygon points="{" ".join(f"{a:.1f},{b:.1f}" for a,b in pts)}" fill="#eeeaf3" {CUT}/>')
    for (gx, gy), n in faces.items():
        x, y = dx + gx*s, dy + gy*s
        o.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" fill="{IVORY}" {FOLD}/>')
        for px, py in PIPS[n]:
            o.append(f'<circle cx="{x+s/2+px*4.6}" cy="{y+s/2+py*4.6}" r="{2.2 if n == 1 else 1.6}" fill="{ORANGE if n == 1 else NAVY}"/>')
    return [sheet1, svg_doc(AW, AH, ''.join(o), 'Marist Trivial · ' + t['tokens'] + ' 2')]
