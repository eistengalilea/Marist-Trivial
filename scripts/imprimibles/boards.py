from common import *
W = 400; C = W/2

def tile(cx, cy, size, cat, rot=0, kind='ring', th=None):
    out = [f'<g transform="rotate({math.degrees(rot):.2f} {cx:.2f} {cy:.2f})">']
    h = size/2
    if kind == 'roll':
        out.append(f'<rect x="{cx-h:.2f}" y="{cy-h:.2f}" width="{size:.2f}" height="{size:.2f}" rx="2.4" fill="{IVORY}" stroke="{GOLD}" stroke-width="0.8"/>')
        out.append('</g>')
        out.append(dice(cx, cy, size/26))
        return ''.join(out)
    c = CATS[cat]
    out.append(f'<rect x="{cx-h:.2f}" y="{cy-h:.2f}" width="{size:.2f}" height="{size:.2f}" rx="2.4" fill="{c["hex"]}" stroke="{c["dark"]}" stroke-width="0.6"/>')
    out.append(f'<rect x="{cx-h+1.5:.2f}" y="{cy-h+1.5:.2f}" width="{size-3:.2f}" height="{size-3:.2f}" rx="1.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.35"/>')
    out.append('</g>')
    out.append(emblem(c['emblem'], cx, cy, size*0.42, '#FFFFFF'))
    return ''.join(out)

def dice(cx, cy, s=1.0):
    o = [f'<g transform="translate({cx:.2f} {cy:.2f}) scale({s:.3f})">',
         f'<rect x="-6.6" y="-8" width="10" height="10" rx="1.8" fill="{NAVY}" transform="rotate(-12 -1.6 -3)"/>',
         f'<circle cx="-1.6" cy="-3" r="1.0" fill="{ORANGE}" transform="rotate(-12 -1.6 -3)"/>',
         f'<rect x="-2.4" y="-3.4" width="10" height="10" rx="1.8" fill="{NAVY}" stroke="{IVORY}" stroke-width="0.7" transform="rotate(14 2.6 1.6)"/>']
    for dx, dy in [(-1,-1),(1,1),(0,0)]:
        o.append(f'<circle cx="{2.6+dx*2.7:.2f}" cy="{1.6+dy*2.7:.2f}" r="0.95" fill="{IVORY}" transform="rotate(14 2.6 1.6)"/>')
    o.append('</g>')
    return ''.join(o)

def hq_tile(cx, cy, cat, size=31):
    c = CATS[cat]; h = size/2; r = size*0.37
    return ''.join([f'<rect x="{cx-h-1.4:.2f}" y="{cy-h-1.4:.2f}" width="{size+2.8}" height="{size+2.8}" rx="4" fill="{GOLD}"/>',
           f'<rect x="{cx-h:.2f}" y="{cy-h:.2f}" width="{size}" height="{size}" rx="3" fill="{c["hex"]}"/>',
           hq_badge(cx, cy, cat, r)])

def hq_badge(cx, cy, cat, r):
    c = CATS[cat]
    return ''.join([f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{c["dark"]}" stroke="#FFFFFF" stroke-width="0.6"/>',
           f'<path d="{wedge_path(cx, cy+r*0.37, 0, r*0.96, -math.pi/2, math.pi/6)}" fill="{c["light"]}" stroke="#FFFFFF" stroke-width="0.5"/>',
           emblem(c['emblem'], cx, cy - r*0.1, r*0.6, '#FFFFFF')])

def hub(spoke_angs, R=28):
    """spoke_angs: lista (ángulo, cat)."""
    o = [f'<circle cx="{C}" cy="{C}" r="{R+2.4}" fill="{GOLD}"/>', f'<circle cx="{C}" cy="{C}" r="{R+0.6}" fill="{NAVY_DD}"/>']
    angs = sorted(spoke_angs); n = len(angs)
    for i, (a, cat) in enumerate(angs):
        prev = angs[i-1][0]; nxt = angs[(i+1) % n][0]
        lo = a - ((a - prev) % (2*math.pi))/2
        hi = a + ((nxt - a) % (2*math.pi))/2
        o.append(f'<path d="{wedge_path(C, C, 10.5, R, (lo+hi)/2, (hi-lo)/2)}" fill="{CATS[cat]["hex"]}" stroke="{NAVY_DD}" stroke-width="0.8"/>')
        o.append(emblem(CATS[cat]['emblem'], C + math.cos(a)*19.5, C + math.sin(a)*19.5, 6, '#FFFFFF'))
    o.append(f'<circle cx="{C}" cy="{C}" r="10.5" fill="{NAVY}" stroke="{GOLD}" stroke-width="0.8"/>')
    o.append(symbol(C, C-0.3, 12.5, '#FFFFFF'))
    return ''.join(o)

def title_block(x, y, th, size=13):
    return (f'<text x="{x}" y="{y}" class="m" font-size="{size}" font-weight="800" fill="{th["title1"]}" text-anchor="middle">Marist</text>'
            f'<text x="{x}" y="{y+size}" class="m" font-size="{size}" font-weight="800" fill="{th["title2"]}" text-anchor="middle">Trivial</text>'
            f'<line x1="{x-20}" y1="{y+size+5.5}" x2="{x+20}" y2="{y+size+5.5}" stroke="{GOLD}" stroke-width="0.4"/>')

def legend(x, y, th, t):
    o = [f'<text x="{x}" y="{y}" class="m" font-size="4" font-weight="700" fill="{th["head"]}" letter-spacing="0.6">{t["cats"]}</text>']
    for i, cat in enumerate(ORDER):
        c = CATS[cat]; yy = y + 8 + i*7
        o.append(f'<rect x="{x}" y="{yy-4.2}" width="5.6" height="5.6" rx="1" fill="{c["hex"]}"/>')
        o.append(emblem(c['emblem'], x+2.8, yy-1.4, 3.6, '#FFFFFF'))
        o.append(f'<text x="{x+8.5}" y="{yy}" class="r" font-size="3.4" font-weight="500" fill="{th["text"]}">{esc(c["name"])}</text>')
    return ''.join(o)

def spaces_key(x, y, th, t):
    o = [f'<text x="{x}" y="{y}" class="m" font-size="4" font-weight="700" fill="{th["head"]}" letter-spacing="0.6">{t["spaces"]}</text>']
    o.append(f'<rect x="{x}" y="{y+4}" width="10" height="10" rx="1.6" fill="{IVORY}" stroke="{GOLD}" stroke-width="0.5"/>')
    o.append(dice(x+5, y+9, 0.42))
    o.append(tlines(x+13, y+10.2, [t['roll']], 3.4, 4, 'r', 500, th['text']))
    o.append(f'<rect x="{x}" y="{y+18}" width="10" height="10" rx="1.6" fill="{GOLD}"/>')
    o.append(f'<path d="{wedge_path(x+5, y+25.2, 0, 5.6, -math.pi/2, math.pi/6)}" fill="#FFFFFF"/>')
    o.append(tlines(x+13, y+21.8, t['hq'], 3.4, 4.2, 'r', 500, th['text']))
    return ''.join(o)

def frame(th, circle=False):
    o = [f'<rect width="{W}" height="{W}" fill="{th["bg"]}"/>']
    if circle:
        o.append(f'<circle cx="{C}" cy="{C}" r="{C-5}" fill="none" stroke="{th["frame"]}" stroke-width="1.2"/>')
        o.append(f'<circle cx="{C}" cy="{C}" r="{C-8}" fill="none" stroke="{th["frame"]}" stroke-width="0.35"/>')
    else:
        o.append(f'<rect x="9" y="9" width="{W-18}" height="{W-18}" rx="4" fill="none" stroke="{th["frame"]}" stroke-width="1.2"/>')
        o.append(f'<rect x="12" y="12" width="{W-24}" height="{W-24}" rx="3" fill="none" stroke="{th["frame"]}" stroke-width="0.35"/>')
    return ''.join(o)

def spoke_band(o, x2, y2, th, w=25):
    o.append(f'<line x1="{C}" y1="{C}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{th["track"]}" stroke-width="{w}"/>')

def spoke_edges(o, x2, y2, th, w=25):
    a = math.atan2(y2-C, x2-C); nx, ny = -math.sin(a)*w/2, math.cos(a)*w/2
    for s in (1, -1):
        o.append(f'<line x1="{C+s*nx:.2f}" y1="{C+s*ny:.2f}" x2="{x2+s*nx:.2f}" y2="{y2+s*ny:.2f}" stroke="{th["edge"]}" stroke-width="0.4" stroke-opacity="0.8"/>')

def spoke_colors(i):
    others = [c for j, c in enumerate(ORDER) if j != i]; off = i % 5
    return others[off:] + others[:off]

def spoke_tiles(o, i, x2, y2, hq_half, size=20, hub_r=28):
    L = math.hypot(x2-C, y2-C); a = math.atan2(y2-C, x2-C)
    d0, d1 = hub_r + 3 + size/2 + 1, L - hq_half - size/2 - 2.5
    cols = spoke_colors(i)
    for s in range(5):
        d = d0 + (d1 - d0) * s / 4
        o.append(tile(C + math.cos(a)*d, C + math.sin(a)*d, size, cols[s], a + math.pi/2))

# ---------------- tablero cuadrado ----------------
def board_square(th, t):
    S, STEP, K = 9.6, 1.6, 16.9
    def perim(r):
        if r < 12: return (-S + r*STEP, -S)
        if r < 24: return (S, -S + (r-12)*STEP)
        if r < 36: return (S - (r-24)*STEP, S)
        return (-S, S - (r-36)*STEP)
    P = lambda x, z: (C + x*K, C + z*K)
    HQ = [0, 12, 18, 24, 36, 42]   # esquinas + centro de los laterales
    ROLL = [6, 15, 21, 30, 39, 45]
    kinds = {}
    for i, r in enumerate(HQ): kinds[r] = ('hq', ORDER[i])
    for r in ROLL: kinds[r] = ('roll', None)
    colored = [r for r in range(48) if r not in kinds]
    # 6 de cada color, sin dos iguales seguidas ni junto a la sede del mismo color
    import itertools
    best = None
    for off in range(6):
        seq = [ORDER[(k + off) % 6] for k in range(36)]
        ok = True
        for k, r in enumerate(colored):
            for nb in ((r-1) % 48, (r+1) % 48):
                if nb in kinds and kinds[nb][0] == 'hq' and kinds[nb][1] == seq[k]: ok = False
        if ok: best = seq; break
    seq = best or [ORDER[k % 6] for k in range(36)]
    for k, r in enumerate(colored): kinds[r] = ('ring', seq[k])

    o = [frame(th)]
    half = S*K; bw = 32
    o.append(f'<rect x="{C-half-bw/2:.2f}" y="{C-half-bw/2:.2f}" width="{2*half+bw:.2f}" height="{2*half+bw:.2f}" fill="none" stroke="{th["track"]}" stroke-width="{bw}"/>')
    ends = [P(*perim(r)) for r in HQ]
    for (x2, y2) in ends: spoke_band(o, x2, y2, th)
    for (x2, y2) in ends: spoke_edges(o, x2, y2, th)
    for d in (bw/2, -bw/2):
        hh = half + d
        o.append(f'<rect x="{C-hh:.2f}" y="{C-hh:.2f}" width="{2*hh:.2f}" height="{2*hh:.2f}" fill="none" stroke="{th["edge"]}" stroke-width="0.5"/>')
    for i, (x2, y2) in enumerate(ends):
        diag = abs(x2 - C) > 1 and abs(y2 - C) > 1
        spoke_tiles(o, i, x2, y2, 17*(1.65 if diag else 1), size=20)
    for r in range(48):
        k, cat = kinds[r]
        if k == 'hq': continue
        cx, cy = P(*perim(r)); o.append(tile(cx, cy, 26, cat, kind=k))
    for i, r in enumerate(HQ):
        cx, cy = P(*perim(r)); o.append(hq_tile(cx, cy, ORDER[i]))
    o.append(hub([(math.atan2(y-C, x-C), ORDER[i]) for i, (x, y) in enumerate(ends)]))
    o.append(title_block(C, C-105, th, 14))
    o.append(legend(C-30, C+78, th, t))
    o.append(spaces_key(C+70, C-48, th, t))
    o.append(symbol(C-100, C-48 + 14, 24, th['sym']))
    return ''.join(o)

# ---------------- tablero circular ----------------
def board_circle(th, t):
    R = 160; band = 26
    o = [frame(th, circle=True)]
    o.append(f'<circle cx="{C}" cy="{C}" r="{R}" fill="none" stroke="{th["track"]}" stroke-width="{band+6}"/>')
    angs = [math.radians(-60 + 60*i) for i in range(6)]
    ends = [(C + math.cos(a)*R, C + math.sin(a)*R) for a in angs]
    for (x2, y2) in ends: spoke_band(o, x2, y2, th)
    for (x2, y2) in ends: spoke_edges(o, x2, y2, th)
    for rr in (R + band/2 + 3, R - band/2 - 3):
        o.append(f'<circle cx="{C}" cy="{C}" r="{rr}" fill="none" stroke="{th["edge"]}" stroke-width="0.5"/>')
    for i, (x2, y2) in enumerate(ends):
        spoke_tiles(o, i, x2, y2, 19, size=20.5)
    step = 2*math.pi/48
    for arc in range(6):
        rot = ORDER[arc:] + ORDER[:arc]; cur = 0
        for sub in range(1, 8):
            a = angs[arc] + sub*step
            path = wedge_path(C, C, R - band/2, R + band/2, a, step/2 - 0.006)
            if sub == 4:
                o.append(f'<path d="{path}" fill="{IVORY}" stroke="{GOLD}" stroke-width="0.7"/>')
                o.append(dice(C + math.cos(a)*R, C + math.sin(a)*R, 0.78))
            else:
                c = CATS[rot[cur]]; cur += 1
                o.append(f'<path d="{path}" fill="{c["hex"]}" stroke="{c["dark"]}" stroke-width="0.5"/>')
                o.append(f'<path d="{wedge_path(C, C, R - band/2 + 1.4, R + band/2 - 1.4, a, step/2 - 0.016)}" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="0.35"/>')
                o.append(emblem(c['emblem'], C + math.cos(a)*R, C + math.sin(a)*R, 9.5, '#FFFFFF'))
    for i, a in enumerate(angs):
        cx, cy = C + math.cos(a)*R, C + math.sin(a)*R
        c = CATS[ORDER[i]]
        o.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="19" fill="{GOLD}"/>')
        o.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="17.4" fill="{c["hex"]}"/>')
        o.append(hq_badge(cx, cy, ORDER[i], 11.5))
    o.append(hub([(a, ORDER[i]) for i, a in enumerate(angs)]))
    o.append(title_block(C, C-98, th, 14))
    o.append(legend(C-29, C+86, th, t))
    o.append(spaces_key(C-108, C+34, th, t))
    o.append(symbol(C+84, C-48, 24, th['sym']))
    return ''.join(o)

# ---------------- troceado en A4 ----------------
def tiles_a4(body, t, label):
    AW, AH = 210, 297; cols, rows = 3, 2
    tw, tht = W/cols, W/rows; g = 8
    pages = []
    for r in range(rows):
        for c in range(cols):
            x0, y0 = c*tw, r*tht
            gr = g if c < cols-1 else 0; gb = g if r < rows-1 else 0
            vw, vh = tw + gr, tht + gb
            ox, oy = (AW - vw)/2, 24
            o = [f'<rect width="{AW}" height="{AH}" fill="#FFFFFF"/>']
            o.append(f'<svg x="{ox:.2f}" y="{oy}" width="{vw:.2f}" height="{vh:.2f}" viewBox="{x0:.2f} {y0:.2f} {vw:.2f} {vh:.2f}">{body}</svg>')
            if gr: o.append(f'<rect x="{ox+tw:.2f}" y="{oy}" width="{gr}" height="{vh:.2f}" fill="#FFFFFF" fill-opacity="0.55"/>'
                            f'<text transform="translate({ox+tw+gr/2+1:.2f} {oy+vh/2:.2f}) rotate(90)" class="m" font-size="3" font-weight="700" fill="#555" text-anchor="middle">{t["glue_zone"]}</text>')
            if gb: o.append(f'<rect x="{ox:.2f}" y="{oy+tht:.2f}" width="{tw:.2f}" height="{gb}" fill="#FFFFFF" fill-opacity="0.55"/>'
                            f'<text x="{ox+tw/2:.2f}" y="{oy+tht+gb/2+1:.2f}" class="m" font-size="3" font-weight="700" fill="#555" text-anchor="middle">{t["glue_zone"]}</text>')
            # marcas de corte en el borde real del trozo
            for (cx, cy) in [(ox, oy), (ox+tw, oy), (ox, oy+tht), (ox+tw, oy+tht)]:
                for dx, dy in [(-6,0),(0,-6)] if (cx, cy) == (ox, oy) else [(-6,0),(0,-6),(6,0),(0,6)]:
                    pass
            def mark(x1, y1, x2, y2): o.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="#666" stroke-width="0.25"/>')
            if c > 0: mark(ox, oy-2, ox, oy-8); mark(ox, oy+vh+2, ox, oy+vh+8)
            if r > 0: mark(ox-2, oy, ox-8, oy); mark(ox+vw+2, oy, ox+vw+8, oy)
            name = f'{"ABC"[c]}{r+1}'
            o.append(f'<text x="12" y="13" class="m" font-size="5" font-weight="800" fill="{NAVY}">{t["tile"]} {name}</text>')
            o.append(f'<text x="12" y="18.5" class="r" font-size="2.7" fill="#555">{esc(label)} · 40 × 40 cm</text>')
            # mapa
            mx, my, ms = AW - 12 - 3*7, 8, 7
            for rr in range(rows):
                for cc in range(cols):
                    on = (rr, cc) == (r, c)
                    o.append(f'<rect x="{mx+cc*ms}" y="{my+rr*ms}" width="{ms-0.8}" height="{ms-0.8}" fill="{NAVY if on else "#E5E1EC"}"/>'
                             f'<text x="{mx+cc*ms+(ms-0.8)/2}" y="{my+rr*ms+4.4}" class="m" font-size="2.6" font-weight="700" fill="{"#fff" if on else "#777"}" text-anchor="middle">{"ABC"[cc]}{rr+1}</text>')
            ny = oy + vh + 14
            o.append(tlines(AW/2, ny, wrap(t['tile_note'], 'Roboto', 'Regular', 2.8, 170), 2.8, 3.8, 'r', 400, '#555', 'middle'))
            pages.append(svg_doc(AW, AH, ''.join(o), f'Marist Trivial · {label} · {name}'))
    return pages
