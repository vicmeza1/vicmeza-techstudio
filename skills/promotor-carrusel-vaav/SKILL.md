---
name: promotor-carrusel-vaav
description: "Produce carruseles de Instagram y LinkedIn para VAAV de punta a punta: brief y lector, textos por lámina para auditoría de Cowork, fondos con Higgsfield en paleta VAAV, láminas 1080×1350 renderizadas con el generador determinista (Cormorant + Inter, barra roja del logo, lockup león estado base), exportación JPG, hospedaje en GitHub (vicmeza-techstudio) y programación en GoHighLevel. Regla que manda: el texto se audita antes de renderizar y el producto nunca se nombra en público (certeza permanente, no vitalicio). Usar cuando Vic diga carrusel, carrusel de instagram, láminas para IG, post de varias imágenes, publica en GHL, programa el carrusel, repite el carrusel con otro texto, hazme la serie de patrimonio, carrusel de retiro, carrusel de GMM, o cuando pida contenido educativo para redes de VAAV. NO para posts de una sola imagen ni para reclutamiento de asesores (eso lleva su propia voz)."
---

# promotor-carrusel-vaav

Carruseles VAAV para redes, con el flujo que quedó probado el 2026-09-02 con IG-CP-01 ("Certeza permanente", 7 láminas). Skill personal de Vic, dentro del plugin del promotor.

**Fuente de verdad del canon:** el vault Stack (`memory.md`: colores, slogan, voz, posicionamiento). Esta skill no lo copia; lo aplica. Lo que sí vive aquí es lo específico de carruseles: sistema visual, plantillas, flujo de auditoría, hospedaje y programación. Si el vault y esta skill se contradicen, manda el vault y se corrige la skill.

**Dónde corren los scripts:** Python 3 con Pillow, Node 18+ con Playwright y un Chromium. Igual en la Mac o en el VM de Cowork. Sin Playwright, el generador igual escribe los HTML y se capturan a mano o con `/design` en Claude Code.

## Reglas que mandan (aprendidas en IG-CP-01)

1. **Texto primero, auditoría después, render al final.** Se escribe el documento de textos (una entrada por lámina más el caption), se manda a auditar a Cowork, y lo que regresa se aplica tal cual, sin retocar. Renderizar antes de la auditoría fue trabajo tirado dos veces.
2. **No se nombra el producto en público.** La auditoría cambió "vitalicio" por "protección con certeza permanente" y quitó el hashtag del producto. VAAV SC no intermedia seguros; el contenido habla de protección, etapas y legado, y remata con el aviso legal.
3. **Solo persona y familia en un carrusel de protección.** Empresa (PM-familia, Hombre Clave) y retiro (los 28,000 días de Tolani) van en carruseles propios. Mezclarlos revuelve el mensaje; Vic lo detectó a la primera.
4. **Un carrusel, un riesgo.** Las tres caras del riesgo se enuncian (morir pronto, vivir demasiado, incapacitarse) y se dice cuál cubre esta pieza. "Incapacitarse", no "enfermar": la tercera cara es invalidez, no gastos médicos.
5. **Sin crédito a autores externos en imagen ni caption** salvo que Vic lo pida. La etiqueta "Concepto · Sanjay Tolani" salió en auditoría. Los conceptos se usan; el nombre no se imprime.
6. **Cero cifras inventadas.** Ni rendimientos, ni casos, ni "casi nadie" convertido en porcentaje. La fórmula de suma asegurada y cualquier "cuánto" se resuelven en diagnóstico, no en el feed.
7. **Beneficio antes que producto.** De 7 láminas, máximo 3 explican mecánica; las demás hablan del lector. El cierre no es la frase de gremio ("no porque vas a morir, sino porque los tuyos van a vivir"); es la de legado: "Dejar lo que tienes es herencia. Dejar lo que ibas a tener es legado."
8. **Voz canon:** español mexicano directo, premium, prudente. Cero em-dashes, cero AI-vocab, "va por nuestra cuenta" en vez de "gratis". Voz VAAV institucional, no voz Vic.

## Flujo (seis pasos, en orden)

### 1. Brief
Preguntar solo lo que falte: tema y riesgo que cubre, lector (directivo con sueldo alto y patrimonio delgado, empresario, profesionista senior), largo (default 7 láminas; rango sano 6 a 8), fecha de publicación y cuenta. Registrar el código de la pieza: `IG-<serie>-<nn>` (IG-CP-01 = Certeza Permanente 01).

### 2. Textos para auditoría
Escribir `textos-<codigo>.md` con la estructura de `references/plantilla-textos.md`: por lámina, titular, cuerpo, pie y etiquetas; al final el caption y los puntos abiertos. Entregarlo como archivo y esperar la auditoría de Cowork. Cuando regrese, aplicar el texto auditado literal y registrar la fecha en el spec.

### 3. Fondos con Higgsfield
Modelo `recraft_v4_1`, aspecto `4:5`, `model_type: standard`, `resolution: 1k`, paleta `["#0B0B0F", "#C81727", "#878AA4"]`. Un prompt por lámina siguiendo `references/higgsfield-fondos.md` (oscuro, cinematográfico, sin personas de frente, sin texto). Usar `generate_image_batch`; si algún índice regresa 429 `rate_limit_reached`, reenviar solo esos. Costo observado: 1.25 créditos por imagen. Descargar y guardar como `fondos/bgN.jpg` a 1080×1350, JPEG calidad 80.

### 4. Spec y render
Llenar `spec.json` (ver `ejemplos/IG-CP-01/spec.json`) con los textos auditados y los fondos. Correr:
```
python3 scripts/gen_carrusel.py spec.json salida/
node scripts/render.mjs salida/          # PNG 1080×1350 por lámina + hoja de contacto
python3 scripts/exportar_jpg.py salida/  # JPG calidad 92 con el código de la pieza
```
Abrir la hoja de contacto y revisar: textos que se cortan (etiquetas del gráfico, títulos largos), legibilidad sobre el fondo, contador y barra de progreso, lockup en láminas 1 y última. Corregir en el spec, nunca en el HTML generado.

### 5. Hospedaje
Instagram por API solo acepta URLs públicas y JPEG. El repo de assets es `vicmeza1/vicmeza-techstudio`, rama `main`, ruta `instagram-vaav/<año>-<serie>/<CODIGO>/<CODIGO>-0N.jpg`. Copiar también el `textos-<codigo>.md` final junto a las imágenes. Antes de programar, verificar que cada URL `https://raw.githubusercontent.com/vicmeza1/vicmeza-techstudio/main/...` responde 200 con `image/jpeg`. Detalle en `references/hospedaje-y-ghl.md`.

### 6. Programación en GoHighLevel
Con el MCP de GHL: `social-media-posting_get-account` para confirmar la cuenta (Instagram `vaavasesores`), `create-post` con `type: post`, `status: scheduled`, `scheduleDate` en UTC (CDMX es UTC-6), caption auditado en `summary`, y `media` como lista de `{url, type: "image/jpeg"}`. Horario habitual de VAAV: 19:00 a 20:30 CDMX. Reportar id del post, hora en CDMX y qué revisar (link de la bio si el caption lo menciona). Ver `references/hospedaje-y-ghl.md` para los ids y el problema conocido de `edit-post`.

## Sistema visual (resumen; detalle en `references/sistema-visual.md`)
- Lienzo 1080×1350. Fondo Higgsfield a sangre + degradado negro (desde abajo o desde arriba según dónde va el texto) + grano fino al 9%.
- Tipografía: Cormorant Garamond (titulares, 92 a 150 px) e Inter (cuerpo 31 a 34 px, pies 23 px, eyebrow 21 px espaciado). Es la pareja de la piel Intermedio del Alquimista.
- Motivo de marca: la barra roja vertical del logo acompaña cada titular (6 px) y la palabra clave de portada (8 px). Sustituye a cualquier rayita horizontal genérica.
- Chrome: eyebrow "VAAV · <serie>" arriba a la izquierda, contador `0X / 0N` en Cormorant itálica a la derecha, barra de progreso segmentada debajo, "Desliza" con chevrón SVG abajo a la derecha (menos en la última).
- Lockup: `assets/lockup-blanco.png` (león + wordmark blanco, barra roja) en portada y cierre. Estado **base**, sin chispa: la chispa se gana cuando la pieza consolida o calcula cifras; un carrusel educativo no lo hace. La chispa solo aparece como imagen (`assets/chispa.png`) junto al slogan en la última lámina.
- Cierre fijo: slogan `✦ AI Financial Architects · El diferenciador VAAV` (chispa como imagen, nunca como glifo), lockup y aviso legal: "Contenido educativo. VAAV SC no intermedia ni vende seguros. Cualquier contratación se realiza a través de un asesor con cédula profesional, a título individual."
- Iconos: SVG de trazo, nunca emoji.

## Tipos de lámina que soporta el generador
`portada`, `lista` (numerada 01/02/03), `comparativa` (dos columnas), `grafica` (línea nivelada contra escalera, sin cifras), `texto` (cuerpo y cierre en itálica), `capas` (Invertir / Ahorrar / Proteger con llave lateral) y `cierre`. Si un carrusel necesita otro tipo, se agrega al generador y se documenta aquí; no se dibuja a mano.

## Entregables por pieza
1. `textos-<codigo>.md` auditado.
2. `spec.json` con textos auditados y fondos.
3. 7 JPG `<CODIGO>-0N.jpg` + hoja de contacto, entregados como archivos.
4. Commit en vicmeza-techstudio con imágenes y textos.
5. Post programado en GHL, con id y hora CDMX reportados.

## Qué no hacer
- No renderizar antes de la auditoría. No "mejorar" el texto auditado.
- No usar el wordmark viejo (`logo-vaav.png` del repo Alquimista): el lockup vigente es el del león.
- No poner la chispa en portada ni en láminas interiores.
- No dejar el crédito a Tolani ni el nombre del producto si la auditoría los quitó.
- No programar con URLs sin verificar ni con PNG.
- No intentar reprogramar con `edit-post` del MCP de GHL hasta que corrijan su esquema; crear post nuevo y pedirle a Vic que borre el anterior en el planificador.
