import os, json, sys, zipfile
from common import *
import boards, cards, tokens

OUT = sys.argv[1]
PREV = sys.argv[2]
jobs = []
os.makedirs(PREV, exist_ok=True)
for lang in ['es', 'pt', 'gl']:
    d = os.path.join(OUT, lang); os.makedirs(d, exist_ok=True)
    tmp = os.path.join(CACHE, 'tmp', lang); os.makedirs(tmp, exist_ok=True)
    set_lang(lang); t = T[lang]
    for shape, fn in (('cuadrado', boards.board_square), ('circular', boards.board_circle)):
        for theme, thname in (('oscuro', 'dark'), ('claro', 'light')):
            slug = f'tablero-{shape}-{"blanco" if theme == "claro" else "oscuro"}'
            body = fn(THEMES[theme], t)
            label = f'{t["board"]} {t["square" if shape == "cuadrado" else "circle"]} · {t[thname]}'
            p = os.path.join(d, slug + '.svg')
            open(p, 'w').write(svg_doc(400, 400, body, 'Marist Trivial · ' + label))
            job = dict(pdf=os.path.join(d, slug + '.pdf'), w=400, h=400, svgs=[p])
            if lang == 'es': job['png'] = os.path.join(PREV, slug + '.png')
            jobs.append(job)
            tiles = boards.tiles_a4(body, t, label)
            tp = []
            for k, svg in enumerate(tiles):
                f = os.path.join(tmp, f'{slug}-a4-{k}.svg'); open(f, 'w').write(svg); tp.append(f)
            job = dict(pdf=os.path.join(d, slug + '-A4.pdf'), w=210, h=297, svgs=tp)
            jobs.append(job)
    # tarjetas
    cards.setup(lang)
    assert not cards.check(), cards.check()
    sp = []
    zp = os.path.join(d, 'tarjetas-svg.zip')
    with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, svg in cards.sheets():
            f = os.path.join(tmp, f'tarjetas-hoja-{name}.svg'); open(f, 'w').write(svg); sp.append(f)
            z.writestr(f'tarjetas-hoja-{name}.svg', svg)
    job = dict(pdf=os.path.join(d, 'tarjetas.pdf'), w=210, h=297, svgs=sp)
    jobs.append(job)
    # fichas
    tk = []
    for k, svg in enumerate(tokens.build(lang)):
        f = os.path.join(d, f'fichas-hoja-{k+1}.svg'); open(f, 'w').write(svg); tk.append(f)
    jobs.append(dict(pdf=os.path.join(d, 'fichas.pdf'), w=210, h=297, svgs=tk))
    if lang == 'es':
        jobs.append(dict(pdf=os.path.join(tmp, 'z.pdf'), w=210, h=297, svgs=[tk[0]], png=os.path.join(PREV, 'fichas.png')))
        jobs.append(dict(pdf=os.path.join(tmp, 'w.pdf'), w=210, h=297, svgs=[sp[0]], png=os.path.join(PREV, 'tarjetas.png'), dsf=2))
json.dump(jobs, open(os.path.join(CACHE, 'jobs.json'), 'w'))
print(len(jobs), 'jobs')
