import json, math, os
from PIL import ImageFont
from xml.sax.saxutils import escape as esc

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get('IMPRIMIBLES_CACHE', os.path.join(HERE, '.cache'))
FONTS = os.environ.get('FONTS_DIR', os.path.join(CACHE, 'fonts'))
DATA = json.load(open(os.path.join(CACHE, 'data.json')))
SYM_VB = [float(v) for v in DATA['sym']['vb'].split()]
SYM_PATHS = DATA['sym']['paths']

NAVY = '#312A4E'; NAVY_D = '#241E3D'; NAVY_DD = '#1C1733'; TRACK = '#4A3F6E'
GOLD = '#D5A53C'; GOLD_L = '#EBCB7A'; GOLD_D = '#9C7420'; IVORY = '#FBF8F3'; ORANGE = '#D37D00'

ORDER = ['blue', 'pink', 'yellow', 'purple', 'green', 'orange']
CATS0 = {
  'blue':   dict(name='Geografía e historia marista', short='Geografía e historia', hex='#3C82B9', light='#8FBCE0', dark='#1F527D', emblem='compass'),
  'pink':   dict(name='Arte y Literatura', short='Arte y Literatura', hex='#C6007E', light='#E85AAE', dark='#7A004E', emblem='diamond'),
  'yellow': dict(name='Historia universal', short='Historia universal', hex='#D5A53C', light='#EBCB7A', dark='#9C7420', emblem='star'),
  'purple': dict(name='MarCha', short='MarCha', hex='#87689B', light='#B7A3C6', dark='#5A4270', emblem='hex'),
  'green':  dict(name='Ciencias y Naturaleza', short='Ciencias', hex='#869830', light='#B2C25E', dark='#566318', emblem='leaf'),
  'orange': dict(name='Deportes y Ocio', short='Deportes y Ocio', hex='#D37D00', light='#F0A040', dark='#8A4A00', emblem='flame'),
}
PLAYERS = ['#FBF8F3', '#D5A53C', '#D37D00', '#869830', '#87689B', '#C6007E']

EMBLEM = {
  'compass': '<path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="{c}"/>',
  'diamond': '<path d="M12 2L20.5 12L12 22L3.5 12L12 2Z" fill="{c}"/>',
  'star': '<path d="M12 2.5L14.9 8.6L21.6 9.5L16.7 14.2L17.9 20.9L12 17.7L6.1 20.9L7.3 14.2L2.4 9.5L9.1 8.6L12 2.5Z" fill="{c}"/>',
  'hex': '<polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="none" stroke="{c}" stroke-width="3.2" stroke-linejoin="round"/>',
  'leaf': '<path d="M12 2C18.5 6.2 20 13.5 12 22C4 13.5 5.5 6.2 12 2Z" fill="{c}"/>',
  'flame': '<path d="M12 2C17.2 7.4 19.2 12 17.5 16.6C16.4 19.5 14.2 21.2 12 21.5C9.8 21.2 7.6 19.5 6.5 16.6C4.8 12 6.8 7.4 12 2Z" fill="{c}"/>',
}

FONT_CSS = ("@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&amp;family=Roboto:wght@400;500;700&amp;display=swap');"
            ".m{font-family:Montserrat,Arial,sans-serif}.r{font-family:Roboto,Arial,sans-serif}")

def svg_doc(w, h, body, title=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}mm" height="{h}mm" viewBox="0 0 {w} {h}">'
            f'<title>{esc(title)}</title><style>{FONT_CSS}</style>{body}</svg>')

def emblem(kind, cx, cy, size, color):
    s = size / 24
    return f'<g transform="translate({cx - size/2:.3f} {cy - size/2:.3f}) scale({s:.4f})">{EMBLEM[kind].format(c=color)}</g>'

def symbol(cx, cy, height, fill, extra=''):
    x0, y0, w, h = SYM_VB
    s = height / h
    paths = ''.join(f'<path d="{d}"/>' for d in SYM_PATHS)
    return (f'<g transform="translate({cx - w*s/2:.3f} {cy - height/2:.3f}) scale({s:.5f}) translate({-x0} {-y0})" '
            f'fill="{fill}" fill-rule="evenodd" {extra}>{paths}</g>')

def die_icon(cx, cy, size, body, pip, pip1=None):
    r = size / 2
    out = [f'<rect x="{cx-r:.2f}" y="{cy-r:.2f}" width="{size:.2f}" height="{size:.2f}" rx="{size*0.18:.2f}" fill="{body}"/>']
    pr = size * 0.09
    for dx, dy in [(-1,-1),(1,1),(0,0),(1,-1),(-1,1)]:
        out.append(f'<circle cx="{cx+dx*size*0.27:.2f}" cy="{cy+dy*size*0.27:.2f}" r="{pr:.2f}" fill="{pip}"/>')
    return ''.join(out)

_fonts = {}
def font(fam, weight):
    key = (fam, weight)
    if key not in _fonts:
        f = ImageFont.truetype(os.path.join(FONTS, f'{fam}.ttf'), 200)
        f.set_variation_by_name(weight)
        _fonts[key] = f
    return _fonts[key]

def text_w(t, fam, weight, size_mm):
    return font(fam, weight).getlength(t) / 200 * size_mm

def wrap(t, fam, weight, size_mm, width):
    words, lines, cur = t.split(), [], ''
    for w in words:
        cand = (cur + ' ' + w).strip()
        if text_w(cand, fam, weight, size_mm) <= width or not cur:
            cur = cand
        else:
            lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def tlines(x, y, lines, size, lh, cls, weight, fill, anchor='start'):
    out = []
    for i, l in enumerate(lines):
        out.append(f'<text x="{x:.2f}" y="{y + i*lh:.2f}" class="{cls}" font-size="{size:.2f}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{esc(l)}</text>')
    return ''.join(out)

def wedge_path(cx, cy, r_in, r_out, a_mid, half):
    a1, a2 = a_mid - half, a_mid + half
    p = lambda r, a: (cx + r*math.cos(a), cy + r*math.sin(a))
    x1,y1 = p(r_in,a1); x2,y2 = p(r_out,a1); x3,y3 = p(r_out,a2); x4,y4 = p(r_in,a2)
    if r_in <= 0.01:
        return f'M{cx:.2f} {cy:.2f} L{x2:.2f} {y2:.2f} A{r_out} {r_out} 0 0 1 {x3:.2f} {y3:.2f} Z'
    return (f'M{x1:.2f} {y1:.2f} L{x2:.2f} {y2:.2f} A{r_out} {r_out} 0 0 1 {x3:.2f} {y3:.2f} '
            f'L{x4:.2f} {y4:.2f} A{r_in} {r_in} 0 0 0 {x1:.2f} {y1:.2f} Z')


CATS = CATS0
T = {
 'es': dict(cats='CATEGORÍAS', spaces='CASILLAS', roll='Vuelve a tirar', hq=['Sede: acierta y', 'gana el quesito'],
            q='PREGUNTAS', a='RESPUESTAS', diff='Dificultad', foot='MarCha · Maristas Compostela',
            sideA='Cara A · anverso', sideB='Cara B · reverso (imprimir a doble cara, giro por el borde largo)', cards='Tarjetas',
            tokens='Fichas', sheet='hoja', of='de', cutnote='Recorta por la línea continua y dobla por la discontinua. Mejor en cartulina de 200–250 g.',
            pawns='Peones', pawns_sub='Uno por jugador. Dobla en triángulo y pega la pestaña bajo la base.', glue='pegar', base='base', P='J', player='Jugador',
            wheels='Marcadores de quesitos', wheels_sub='Uno por jugador. Coloca encima cada quesito que ganes (hoja 2).',
            wedges='Quesitos', wedges_sub='Seis de cada color: uno por jugador. Encajan en las casillas del marcador.',
            die='Dado', die_sub='Recorta, dobla por las líneas discontinuas y pega las pestañas.',
            board='Tablero', square='cuadrado', circle='circular', dark='fondo oscuro', light='fondo blanco',
            tile='Hoja', tile_note='Recorta el margen por las marcas de corte en los lados sin franja gris y pega cada hoja sobre la franja «pegar» de su vecina.', glue_zone='PEGAR AQUÍ'),
 'pt': dict(cats='CATEGORIAS', spaces='CASAS', roll='Volta a lançar', hq=['Sede: acerta e', 'ganha o queijinho'],
            q='PERGUNTAS', a='RESPOSTAS', diff='Dificuldade', foot='MarCha · Maristas Compostela',
            sideA='Face A · frente', sideB='Face B · verso (imprimir frente e verso, virar pela margem longa)', cards='Cartões',
            tokens='Peças', sheet='folha', of='de', cutnote='Recorta pela linha contínua e dobra pela tracejada. Melhor em cartolina de 200–250 g.',
            pawns='Peões', pawns_sub='Um por jogador. Dobra em triângulo e cola a aba debaixo da base.', glue='colar', base='base', P='J', player='Jogador',
            wheels='Marcadores de queijinhos', wheels_sub='Um por jogador. Coloca em cima cada queijinho que ganhares (folha 2).',
            wedges='Queijinhos', wedges_sub='Seis de cada cor: um por jogador. Encaixam nas casas do marcador.',
            die='Dado', die_sub='Recorta, dobra pelas linhas tracejadas e cola as abas.',
            board='Tabuleiro', square='quadrado', circle='circular', dark='fundo escuro', light='fundo branco',
            tile='Folha', tile_note='Recorta a margem pelas marcas de corte nos lados sem faixa cinzenta e cola cada folha sobre a faixa «colar» da vizinha.', glue_zone='COLAR AQUI'),
 'gl': dict(cats='CATEGORÍAS', spaces='CASAS', roll='Volve tirar', hq=['Sede: acerta e', 'gaña o quesiño'],
            q='PREGUNTAS', a='RESPOSTAS', diff='Dificultade', foot='MarCha · Maristas Compostela',
            sideA='Cara A · anverso', sideB='Cara B · reverso (imprimir a dobre cara, xiro polo bordo longo)', cards='Tarxetas',
            tokens='Fichas', sheet='folla', of='de', cutnote='Recorta pola liña continua e dobra pola descontinua. Mellor en cartolina de 200–250 g.',
            pawns='Peóns', pawns_sub='Un por xogador. Dobra en triángulo e pega a lapela baixo a base.', glue='pegar', base='base', P='X', player='Xogador',
            wheels='Marcadores de quesiños', wheels_sub='Un por xogador. Pon enriba cada quesiño que gañes (folla 2).',
            wedges='Quesiños', wedges_sub='Seis de cada cor: un por xogador. Encaixan nas casas do marcador.',
            die='Dado', die_sub='Recorta, dobra polas liñas descontinuas e pega as lapelas.',
            board='Taboleiro', square='cadrado', circle='circular', dark='fondo escuro', light='fondo branco',
            tile='Folla', tile_note='Recorta a marxe polas marcas de corte nos lados sen franxa gris e pega cada folla sobre a franxa «pegar» da veciña.', glue_zone='PEGAR AQUÍ'),
}

def set_lang(lang):
    global CATS
    for k in ORDER:
        CATS0[k]['name'] = DATA['cats'][lang][k]['name']
        CATS0[k]['short'] = DATA['cats'][lang][k]['short']

def questions(lang):
    out = []
    for q in DATA['q']:
        q = dict(q)
        if lang != 'es':
            p, opts, ex = DATA[lang][q['id']]
            q.update(prompt=p, options=opts, explanation=ex)
        out.append(q)
    return out

THEMES = {
  'oscuro': dict(bg=NAVY, track=TRACK, edge=GOLD, text='#FFFFFF', title1='#FFFFFF', title2=GOLD, frame=GOLD, sym='#FFFFFF', head=GOLD),
  'claro':  dict(bg='#FFFFFF', track='#ECE7F2', edge=GOLD, text=NAVY, title1=NAVY, title2=GOLD_D, frame=GOLD, sym=NAVY, head=GOLD_D),
}
