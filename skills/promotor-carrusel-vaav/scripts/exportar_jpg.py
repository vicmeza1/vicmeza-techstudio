#!/usr/bin/env python3
"""Convierte lamina-NN.png a <CODIGO>-NN.jpg (calidad 92) y arma la hoja de contacto.
Uso: python3 exportar_jpg.py salida/  [--calidad 92]"""
import sys, os, json, glob
from PIL import Image
out=sys.argv[1]; q=int(sys.argv[sys.argv.index("--calidad")+1]) if "--calidad" in sys.argv else 92
meta=json.load(open(os.path.join(out,"meta.json"))); cod=meta["codigo"]
pngs=sorted(glob.glob(os.path.join(out,"lamina-*.png")))
if not pngs: sys.exit("no hay PNG; corre render.mjs primero")
cols=4; rows=(len(pngs)+cols-1)//cols; sheet=Image.new("RGB",(cols*540,rows*675),"white")
for k,pth in enumerate(pngs):
    im=Image.open(pth).convert("RGB"); im.save(os.path.join(out,f"{cod}-{k+1:02d}.jpg"),quality=q,optimize=True)
    sheet.paste(im.resize((540,675),Image.LANCZOS),((k%cols)*540,(k//cols)*675))
sheet.save(os.path.join(out,f"{cod}-hoja-de-contacto.jpg"),quality=85)
print("ok:", len(pngs), "jpg +", f"{cod}-hoja-de-contacto.jpg")
