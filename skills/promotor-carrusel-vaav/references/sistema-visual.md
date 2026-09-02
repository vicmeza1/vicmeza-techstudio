# Sistema visual de carruseles VAAV

Derivado de la piel Intermedio del Alquimista y de marca.py (cerebro vaav_onepager). Probado en IG-CP-01.

## Lienzo y capas
- 1080×1350 px (4:5). Una lámina por archivo.
- Capa 1: fondo Higgsfield con `object-fit: cover`.
- Capa 2: degradado `rgba(8,8,12)` de 0.96 a 0.28 desde el borde donde va el texto (`bottom` o `top`). Para fondos muy cargados, `flat` (0.94 a 0.82 uniforme).
- Capa 3: grano SVG `feTurbulence` baseFrequency 0.9, opacidad 0.09, mix-blend overlay. Unifica fotos de sesiones distintas.
- Capa 4: chrome y contenido.

## Colores (canon)
Rojo #C81727 · rojo secundario #E83C4B · gris #878AA4 · negro de lienzo #08080C · papel #F4F3F6 · texto suave #D9D9E1.

## Tipografía
- Cormorant Garamond 500 para titulares (92 px dos líneas, 96 una y media, 150 palabra clave de portada). Itálica 400 para citas y contador.
- Inter 400/500/600 para cuerpo (31 a 34 px, interlínea 1.38), pies (23 px, gris), eyebrow y etiquetas (19 a 22 px, mayúsculas, tracking 0.16 a 0.22 em).
- Google Fonts en el HTML; en export PNG cae a Georgia / system-ui, por eso los titulares llevan 10% de holgura.

## Chrome fijo
- Eyebrow arriba izquierda: `VAAV · <SERIE>` en mayúsculas gris.
- Contador arriba derecha: `0X` en papel y ` / 0N` en gris, Cormorant itálica 30 px.
- Barra de progreso: N segmentos de 3 px con gap 6; los cumplidos en rojo, el resto gris al 35%.
- "Desliza" + chevrón SVG abajo derecha, salvo la última.
- Márgenes: 72 px laterales; bloque de contenido anclado a 150 px del fondo o 190 px del tope.

## Motivo de marca
Barra roja vertical (la del separador del logo): 6 px pegada al titular con gap 28; 8 px junto a la palabra clave de portada. Reemplaza la rayita horizontal de 72×4 que usábamos antes.

## Lockup y chispa
- `lockup-blanco.png`: tile rojo con león + wordmark blanco + barra roja. Portada (64 px alto) y cierre (60 px).
- Estado base (sin chispa) para contenido educativo. La chispa (`chispa.png`, amarillo #F5C518) solo va como imagen a 30 px junto al slogan del cierre.
- El wordmark viejo sin león ya no se usa.

## Tipos de lámina y medidas
- portada: kicker Inter 64 px gris suave dentro del h1, palabra clave Cormorant 150 px, bajada itálica 46 px, pie 23 px.
- lista: filas grid 92 px + resto, numeral Cormorant itálica 52 px rojo secundario, título Inter 600 34 px, descripción 27 px, separadores 1 px gris 35%.
- comparativa: dos columnas con encabezado 22 px espaciado (gris / rojo), viñetas cuadradas (hueca gris / rellena roja) y 27 px de texto.
- grafica: SVG a lo ancho, línea roja nivelada 5 px, escalera gris punteada 2.5 px, etiquetas 19 px con tracking 0.08 (más largas se cortan), extremos HOY / TODA LA VIDA. La línea roja se sitúa a 660 px para coincidir con el horizonte del fondo bg5.
- texto: dos párrafos 32 px y cierre itálico Cormorant 54 px.
- capas: tres bloques (600 / 840 / 840 px) con numeral romano itálico, nombre Cormorant 52 px y subetiqueta; los que cubre la pieza en rojo al 88%, el resto vidrio (blur 6 px, borde gris). Llave lateral de 4 px con texto vertical.
- cierre: cita itálica 82 px con barra, cuerpo 32, llamado 26 gris, slogan con chispa, lockup, aviso legal 18 px.

## Comprobaciones antes de exportar
1. Ninguna etiqueta del gráfico rebasa 936 px de ancho.
2. El texto no pisa la zona brillante del fondo (mover el bloque o cambiar `pos`).
3. Contador y barra coinciden con el número de láminas.
4. Portada y cierre llevan lockup; solo el cierre lleva chispa.
5. Búsqueda en los HTML de "vitalicio", "Tolani" y "—": cero resultados.
