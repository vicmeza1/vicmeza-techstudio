# IG-CP-01 · Certeza permanente (2026-09-02)

Pieza de referencia: 7 láminas, texto auditado por Cowork, publicada en Instagram vaavasesores vía GHL.
- `spec.json`: textos auditados y fondos, tal como se renderizó.
- `textos-IG-CP-01.md`: documento de textos con caption final.
- Fondos Higgsfield (bg1, bg2, bg4, bg5, bg6, bg9, bg10) y JPG finales publicados viven en el repo de assets:
  `https://raw.githubusercontent.com/vicmeza1/vicmeza-techstudio/main/instagram-vaav/2026-patrimonio/IG-CP-01/fondos/bgN.jpg`

Para reproducirla:
```
mkdir -p fondos && for n in 1 2 4 5 6 9 10; do curl -sSo fondos/bg$n.jpg https://raw.githubusercontent.com/vicmeza1/vicmeza-techstudio/main/instagram-vaav/2026-patrimonio/IG-CP-01/fondos/bg$n.jpg; done
python3 ../../scripts/gen_carrusel.py spec.json salida/ && node ../../scripts/render.mjs salida/ && python3 ../../scripts/exportar_jpg.py salida/
```
