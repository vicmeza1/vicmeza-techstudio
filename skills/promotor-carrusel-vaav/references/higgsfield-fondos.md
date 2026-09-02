# Fondos con Higgsfield

Modelo: `recraft_v4_1` · aspecto `4:5` · `model_type: standard` · `resolution: 1k` · `colors: ["#0B0B0F", "#C81727", "#878AA4"]`.
Costo observado: 1.25 créditos por imagen. Salida 896×1152; se reescala a 1080×1350 JPEG 80 (queda entre 150 y 270 KB, apto para Instagram). Si la imagen va a un lienzo de diseño, bajar a ~900 px de ancho y calidad 62 para quedar bajo 70 KB.

## Estilo que funcionó
Oscuro, cinematográfico, un solo sujeto, mucho espacio negativo hacia donde irá el texto, luz roja rasante, "no people, no text, no logos". Personas solo en silueta y de espaldas.

## Prompts de IG-CP-01 (reutilizables por tema)
- Portada / permanencia: "Monumental dark stone architecture, a single tall column standing alone in cold dawn haze, deep crimson light grazing one edge, vast negative space in the upper half, photorealistic cinematic still, low key, matte black shadows, no people, no text, no logos"
- Tres caras del riesgo: "Three tall basalt monoliths standing in dense fog on a black plain, faint crimson glow behind them, ultra dark moody cinematic photograph, grain, generous empty space above, no people, no text"
- Casa / familia: "Elegant modern house facade at blue hour, one warm lit window, dark surrounding garden, restrained architectural photography, deep shadows, crimson accent in the sky, no people, no text"
- Aportación nivelada (horizonte): "Perfectly still dark water with a razor sharp level horizon line at night, thin crimson line of light on the horizon, black sky, minimalist long exposure photograph, no people, no text"
- Capacidad de generar ingreso: "Hands of an artisan working leather at a dark workshop bench, only the hands and tools lit by a warm lamp with crimson tint, black background, cinematic photorealistic, no face visible, no text"
- Capas / cimiento: "Massive cut stone foundation blocks stacked in three clear layers, dark quarry stone, raking crimson light from the side, black background, photorealistic architectural detail, no people, no text"
- Cierre / legado: "Silhouette of a family of four seen from behind walking along a wooden pier toward a dark crimson dusk sky, backlit, faces not visible, cinematic photorealistic, moody, wide empty sky above, no text"
- Reservados para otros carruseles: arena cayendo (retiro, 28,000 días), sala de juntas vacía (Hombre Clave), planos sobre mármol (fórmula o diagnóstico).

## Operación
1. `generate_image_batch` con hasta 12 peticiones indexadas.
2. Si un índice regresa `429 rate_limit_reached`, reenviar solo esos índices en un segundo batch.
3. `jobs_wait` hasta `all_terminal`, descargar `result_url` con curl, y una sola llamada a `show_generation_by_ids` si Vic quiere verlas en el widget.
4. Guardar `fondos/bgN.jpg` y anotar en el spec qué fondo lleva cada lámina y con qué `pos` (bottom / top / flat) según dónde está la zona oscura.
