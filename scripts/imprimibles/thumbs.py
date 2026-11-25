"""Miniaturas JPG para la ventana de descargas."""
import os, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
for name in ['tablero-cuadrado-blanco', 'tablero-cuadrado-oscuro', 'tablero-circular-blanco', 'tablero-circular-oscuro']:
    Image.open(os.path.join(src, name + '.png')).convert('RGB').resize((360, 360), Image.LANCZOS).save(os.path.join(dst, name + '.jpg'), quality=82)
im = Image.open(os.path.join(src, 'tarjetas.png')).convert('RGB')
w, h = im.size
card = im.crop((int(w*0.071), int(h*0.033), int(w*0.5), int(h*0.505)))
card.thumbnail((240, 400), Image.LANCZOS); card.save(os.path.join(dst, 'tarjetas.jpg'), quality=85)
im = Image.open(os.path.join(src, 'fichas.png')).convert('RGB'); im.thumbnail((240, 340), Image.LANCZOS)
im.save(os.path.join(dst, 'fichas.jpg'), quality=85)
m = os.path.join(src, 'manual.png')
if os.path.exists(m):
    im = Image.open(m).convert('RGB'); im.thumbnail((240, 340), Image.LANCZOS)
    im.save(os.path.join(dst, 'manual.jpg'), quality=85)
