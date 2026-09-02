#!/usr/bin/env python3
"""Genera las láminas HTML de un carrusel VAAV a partir de un spec.json.

Uso: python3 gen_carrusel.py spec.json salida/
Escribe salida/lamina-01.html ... y copia fondos y assets referenciados.
Tipos de lámina: portada, lista, comparativa, grafica, texto, capas, cierre.
El texto entra literal del spec (ya auditado); el script solo compone.
"""
import json, os, shutil, sys, html

ROJO="#C81727"; ROJO2="#E83C4B"; GRIS="#878AA4"; INK="#08080C"; PAPEL="#F4F3F6"; SUAVE="#D9D9E1"
SERIF="font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;"
SANS="font-family: 'Inter', system-ui, -apple-system, sans-serif;"
HERE=os.path.dirname(os.path.abspath(__file__))
ASSETS=os.path.join(os.path.dirname(HERE), "assets")

HEAD='''<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@400;500;600&display=swap">
<style>body{margin:0;background:#08080C;-webkit-font-smoothing:antialiased}</style></head><body>'''
TAIL='</body></html>\n'
GRAIN=('<svg style="position: absolute; inset: 0; width: 1080px; height: 1350px; opacity: 0.09; mix-blend-mode: overlay; pointer-events: none;" xmlns="http://www.w3.org/2000/svg">'
       '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"></feTurbulence><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"></feColorMatrix></filter>'
       '<rect width="100%" height="100%" filter="url(#g)"></rect></svg>')

def br(t): return html.escape(t).replace("\\n","<br>").replace("\n","<br>")
def chevron(color=GRIS, size=22):
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M9 6l6 6-6 6"></path></svg>'
def overlay(pos):
    if pos=="top": g="linear-gradient(to bottom, rgba(8,8,12,0.96) 0%, rgba(8,8,12,0.86) 42%, rgba(8,8,12,0.40) 72%, rgba(8,8,12,0.22) 100%)"
    elif pos=="flat": g="linear-gradient(to top, rgba(8,8,12,0.94) 0%, rgba(8,8,12,0.82) 100%)"
    else: g="linear-gradient(to top, rgba(8,8,12,0.96) 0%, rgba(8,8,12,0.86) 38%, rgba(8,8,12,0.42) 68%, rgba(8,8,12,0.28) 100%)"
    return f'<div style="position: absolute; inset: 0; background: {g};"></div>'
def chrome(i, n, eyebrow):
    segs="".join(f'<div style="height: 3px; flex: 1; background: {ROJO if k<=i else "rgba(135,138,164,0.35)"};"></div>' for k in range(1,n+1))
    return (f'<div style="position: absolute; top: 64px; left: 72px; right: 72px; z-index: 2; display: flex; flex-direction: column; gap: 18px;">'
            f'<div style="display: flex; justify-content: space-between; align-items: center;">'
            f'<div style="{SANS} font-size: 21px; font-weight: 500; letter-spacing: 0.2em; color: {GRIS}; text-transform: uppercase;">{html.escape(eyebrow)}</div>'
            f'<div style="{SERIF} font-style: italic; font-size: 30px; color: {PAPEL};">{i:02d}<span style="color: {GRIS};"> / {n:02d}</span></div></div>'
            f'<div style="display: flex; gap: 6px; width: 100%;">{segs}</div></div>')
def h1bar(t, size=92, italic=False):
    it="font-style: italic;" if italic else ""
    return (f'<div style="display: flex; align-items: stretch; gap: 28px; margin: 0 0 36px 0;"><div style="width: 6px; background: {ROJO}; flex: none;"></div>'
            f'<h1 style="{SERIF} {it} font-size: {size}px; font-weight: 500; line-height: 1.0; letter-spacing: -0.01em; margin: 0; color: {PAPEL}; text-wrap: balance;">{br(t)}</h1></div>')
def p(t, size=32, color=SUAVE, mt=0, weight=400, lh=1.38):
    return f'<p style="{SANS} font-size: {size}px; font-weight: {weight}; line-height: {lh}; color: {color}; margin: {mt}px 0 0 0; text-wrap: pretty;">{br(t)}</p>'
def small(t, mt=28): return p(t, 23, GRIS, mt, 400, 1.45)
def block(pos, inner):
    anchor="top: 190px;" if pos=="top" else "bottom: 150px;"
    return f'<div style="position: absolute; left: 72px; {anchor} width: 936px; z-index: 2; display: flex; flex-direction: column; align-items: flex-start;">{inner}</div>'
def frame(i, n, eyebrow, bg, pos, body, swipe=True, extra=""):
    sw=(f'<div style="position: absolute; bottom: 60px; right: 72px; display: flex; align-items: center; gap: 8px; z-index: 2;">'
        f'<div style="{SANS} font-size: 20px; font-weight: 500; letter-spacing: 0.18em; color: {GRIS}; text-transform: uppercase;">Desliza</div>{chevron()}</div>') if swipe else ''
    return (HEAD+f'<div style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background: {INK}; color: {PAPEL}; {SANS}">'
            f'<img src="{bg}" alt="" style="position: absolute; inset: 0; width: 1080px; height: 1350px; object-fit: cover; display: block;">'
            + overlay(pos) + GRAIN + chrome(i, n, eyebrow) + extra + body + sw + '</div>'+TAIL)

def lam_portada(s):
    kick=br(s.get("kicker","Seguro de vida")); pal=br(s["palabra"])
    return block("bottom",
        f'<img src="lockup-blanco.png" alt="VAAV" style="height: 64px; width: auto; display: block; margin: 0 0 64px 0;">'
        f'<div style="display: flex; align-items: stretch; gap: 30px; margin: 0 0 44px 0;"><div style="width: 8px; background: {ROJO}; flex: none;"></div>'
        f'<h1 style="{SERIF} font-size: {s.get("tam",150)}px; font-weight: 500; line-height: 0.92; letter-spacing: -0.03em; margin: 0 0 0 -6px; color: {PAPEL};">'
        f'<span style="display: block; font-size: 64px; font-weight: 400; letter-spacing: 0; color: {SUAVE}; margin: 0 0 18px 6px;">{kick}</span>{pal}<span style="color: {ROJO};">.</span></h1></div>'
        f'<p style="{SERIF} font-style: italic; font-size: 46px; font-weight: 400; line-height: 1.12; color: {PAPEL}; margin: 0; max-width: 900px; text-wrap: balance;">{br(s["bajada"])}</p>'
        + small(s["pie"], 36))

def lam_lista(s):
    rows="".join(
        f'<div style="display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 0 24px; padding: 26px 0; border-top: 1px solid rgba(135,138,164,0.35);">'
        f'<div style="{SERIF} font-style: italic; font-size: 52px; line-height: 1; color: {ROJO2}; padding-top: 2px;">{k+1:02d}</div>'
        f'<div style="display: flex; flex-direction: column; gap: 8px;"><div style="{SANS} font-size: 34px; font-weight: 600; line-height: 1.2; color: {PAPEL};">{br(it["titulo"])}</div>'
        f'<div style="{SANS} font-size: 27px; line-height: 1.38; color: {SUAVE};">{br(it["texto"])}</div></div></div>' for k,it in enumerate(s["items"]))
    return block(s.get("pos","bottom"), h1bar(s["titular"], 96) + (p(s["bajada"]) if s.get("bajada") else "")
        + f'<div style="display: flex; flex-direction: column; width: 100%;">{rows}</div>' + (small(s["pie"], 30) if s.get("pie") else ""))

def col(title, color, items, filled):
    mark=(f'<div style="width: 12px; height: 12px; background: {ROJO}; flex: none; margin-top: 11px;"></div>' if filled
          else f'<div style="width: 12px; height: 12px; border: 1.5px solid {GRIS}; flex: none; margin-top: 10px; box-sizing: border-box;"></div>')
    lis="".join(f'<div style="display: flex; gap: 18px; align-items: flex-start;">{mark}<div style="{SANS} font-size: 27px; line-height: 1.32; color: {SUAVE};">{br(t)}</div></div>' for t in items)
    return (f'<div style="display: flex; flex-direction: column; gap: 22px; padding-top: 22px; border-top: 2px solid {color};">'
            f'<div style="{SANS} font-size: 22px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: {color}; margin-bottom: 6px;">{br(title)}</div>{lis}</div>')
def lam_comparativa(s):
    a,b=s["columnas"]
    return block(s.get("pos","bottom"), h1bar(s["titular"], 92) + p(s["bajada"])
        + f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px; width: 100%; margin-top: 44px;">'
        + col(a["titulo"], GRIS, a["items"], False) + col(b["titulo"], ROJO2, b["items"], True) + '</div>' + small(s["pie"], 40))

def lam_grafica(s):
    HZ=s.get("horizonte",660)
    chart=(f'<svg style="position: absolute; left: 72px; top: 0; z-index: 2;" width="936" height="{HZ+60}" viewBox="0 0 936 {HZ+60}" fill="none">'
       f'<path d="M0 {HZ} H200 V{HZ-56} H400 V{HZ-118} H600 V{HZ-186} H800 V{HZ-260} H936" stroke="{GRIS}" stroke-width="2.5" stroke-dasharray="8 8" stroke-linejoin="round"></path>'
       f'<line x1="0" y1="{HZ}" x2="936" y2="{HZ}" stroke="{ROJO}" stroke-width="5" stroke-linecap="round"></line><circle cx="0" cy="{HZ}" r="9" fill="{ROJO}"></circle>'
       f'<text x="24" y="{HZ-22}" fill="{ROJO2}" style="{SANS} font-size: 19px; font-weight: 600; letter-spacing: 0.08em;">{html.escape(s["etiqueta_roja"])}</text>'
       f'<text x="936" y="{HZ-282}" fill="{GRIS}" text-anchor="end" style="{SANS} font-size: 19px; font-weight: 500; letter-spacing: 0.08em;">{html.escape(s["etiqueta_gris"])}</text>'
       f'<text x="0" y="{HZ+44}" fill="{GRIS}" style="{SANS} font-size: 20px; letter-spacing: 0.14em;">{html.escape(s.get("inicio","HOY"))}</text>'
       f'<text x="936" y="{HZ+44}" fill="{GRIS}" text-anchor="end" style="{SANS} font-size: 20px; letter-spacing: 0.14em;">{html.escape(s.get("fin","TODA LA VIDA"))}</text></svg>')
    return block("bottom", h1bar(s["titular"], 92) + p(s["cuerpo"], 31) + small(s["pie"], 30)), chart

def lam_texto(s):
    body=h1bar(s["titular"], 92)
    for k,t in enumerate(s["parrafos"]): body+=p(t, 32, SUAVE, 26 if k else 0)
    if s.get("cierre"): body+=f'<p style="{SERIF} font-style: italic; font-size: 54px; font-weight: 400; line-height: 1.1; color: {PAPEL}; margin: 40px 0 0 0; text-wrap: balance;">{br(s["cierre"])}</p>'
    return block(s.get("pos","top"), body)

def capa(t, w, filled, sub, roman):
    st=(f'background: rgba(200,23,39,0.88); border: 2px solid {ROJO};' if filled
        else f'background: rgba(8,8,12,0.28); border: 2px solid rgba(135,138,164,0.6); backdrop-filter: blur(6px);')
    return (f'<div style="width: {w}px; {st} color: {PAPEL}; padding: 22px 30px; display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; gap: 0 18px; align-items: baseline; box-sizing: border-box;">'
            f'<div style="{SERIF} font-style: italic; font-size: 40px; line-height: 1; opacity: 0.85;">{roman}</div>'
            f'<div style="{SERIF} font-size: 52px; font-weight: 500; line-height: 1;">{br(t)}</div>'
            f'<div style="{SANS} font-size: 20px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.85;">{br(sub)}</div></div>')
def lam_capas(s):
    caps=s["capas"]  # de arriba a abajo: [{nombre, sub, cubierta}]
    romans=["III","II","I"][-len(caps):]
    blocks="".join(capa(c["nombre"], 600 if k==0 else 840, c.get("cubierta",False), c["sub"], romans[k]) for k,c in enumerate(caps))
    n_cub=sum(1 for c in caps if c.get("cubierta"))
    bracket=(f'<div style="display: flex; align-items: stretch; gap: 22px; height: 100%;"><div style="width: 4px; background: {ROJO}; flex: none;"></div>'
             f'<div style="{SANS} font-size: 19px; font-weight: 600; letter-spacing: 0.06em; color: {ROJO2}; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; white-space: nowrap;">{br(s["llave"])}</div></div>')
    return block("bottom", h1bar(s["titular"], 92) + p(s["cuerpo"])
        + f'<div style="display: grid; grid-template-columns: minmax(0, 1fr) 72px; gap: 0 24px; width: 100%; margin-top: 44px; align-items: end;">'
        + f'<div style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">{blocks}</div>'
        + f'<div style="height: {n_cub*100+ (n_cub-1)*10}px; align-self: end;">{bracket}</div></div>' + small(s["pie"], 34))

def lam_cierre(s):
    return block("top",
        f'<div style="display: flex; align-items: stretch; gap: 28px; margin: 0 0 44px 0;"><div style="width: 6px; background: {ROJO}; flex: none;"></div>'
        f'<p style="{SERIF} font-style: italic; font-size: 82px; font-weight: 400; line-height: 1.04; letter-spacing: -0.01em; color: {PAPEL}; margin: 0; text-wrap: balance;">{br(s["titular"])}</p></div>'
        + p(s["cuerpo"]) + p(s["llamado"], 26, GRIS, 24)
        + f'<div style="display: flex; align-items: center; gap: 14px; margin-top: 52px;"><img src="chispa.png" alt="" style="height: 30px; width: auto; display: block;">'
        + f'<div style="{SANS} font-size: 24px; font-weight: 600; letter-spacing: 0.06em; color: {PAPEL};">AI Financial Architects · El diferenciador VAAV</div></div>'
        + f'<img src="lockup-blanco.png" alt="VAAV" style="height: 60px; width: auto; display: block; margin: 34px 0 0 0;">'
        + f'<p style="{SANS} font-size: 18px; line-height: 1.45; color: {GRIS}; margin: 40px 0 0 0; max-width: 900px;">{br(s.get("legal","Contenido educativo. VAAV SC no intermedia ni vende seguros. Cualquier contratación se realiza a través de un asesor con cédula profesional, a título individual."))}</p>')

TIPOS={"portada":lam_portada,"lista":lam_lista,"comparativa":lam_comparativa,"texto":lam_texto,"capas":lam_capas,"cierre":lam_cierre}

def main(spec_path, out):
    spec=json.load(open(spec_path)); os.makedirs(out, exist_ok=True)
    base=os.path.dirname(os.path.abspath(spec_path))
    n=len(spec["laminas"]); eyebrow=spec["eyebrow"]
    for k,s in enumerate(spec["laminas"], start=1):
        extra=""
        if s["tipo"]=="grafica": body,extra=lam_grafica(s)
        else: body=TIPOS[s["tipo"]](s)
        pos=s.get("pos","top" if s["tipo"] in ("texto","cierre") else "bottom")
        bgname=os.path.basename(s["fondo"])
        shutil.copy(os.path.join(base, s["fondo"]), os.path.join(out, bgname))
        open(os.path.join(out, f"lamina-{k:02d}.html"),"w").write(frame(k, n, eyebrow, bgname, pos, body, swipe=(k<n), extra=extra))
    for a in ("lockup-blanco.png","chispa.png"): shutil.copy(os.path.join(ASSETS,a), os.path.join(out,a))
    json.dump({"codigo":spec["codigo"],"n":n}, open(os.path.join(out,"meta.json"),"w"))
    print(f"ok: {n} láminas en {out}")

if __name__=="__main__":
    if len(sys.argv)!=3: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
