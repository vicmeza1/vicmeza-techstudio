---
pieza: carruseles/clientes-lo-que-ya-contrato
nombre: carrusel · clientes · Cuatro preguntas sobre lo que ya contrataste
hermana_de: videos/clon-ia-vic/clientes-lo-que-ya-contrato (Reel primero; el carrusel es para guardar)
canales: Instagram (vaavasesores) carrusel · LinkedIn perfil de Vic
destinatario: S3 y S1 · directivo o empresario que firmó su protección, la archivó y no sabe qué cubre
momento: M3 después del cierre (ya contrató, con VAAV o con otro asesor; siguiente paso: revisión con su asesor)
pista: cliente
estado: render v3 terminado 18-oct-2026 23:00 MX; láminas en laminas/, PDF de LinkedIn y spec.json; sin programar (sale después del Reel v2)
---

# Carrusel "Cuatro preguntas sobre lo que ya contrataste" · Textos para auditoría

Estado: 8 láminas, versión 18-oct-2026. Voz VAAV institucional. Público: directivo o empresario que ya contrató su protección. Riesgo que cubre: entender la protección de vida que ya tiene (fallecimiento y lo que su contrato agregue).
Elementos fijos: eyebrow "VAAV · Protección en claro", contador 0X / 08 con barra de progreso, "Desliza" (menos en la última).
Premisa (canon-value-stack, El Traductor, regla 8): la protección responde según el contrato aunque no se entienda; lo que se entiende, se cuida.
3P: persona, quien firmó su protección y la archivó; problema, nadie se lo explicó en su idioma y no sabe qué cubre; camino, cuatro preguntas para su asesor.

## Lámina 01 · Portada
- Título: ¿Sabes qué cubre lo que ya contrataste?
- Bajada: Lo firmaste, lo archivaste y seguiste. Cuatro preguntas para hacerle a tu asesor.
- Pie: sin pie (crítica de diseño: competía con la foto y con el lockup).

## Lámina 02 · Reencuadre
- Titular: Nadie te lo explicó *en tu idioma.*
- Cuerpo: No es descuido. Tu protección responde según tu contrato, la entiendas o no. Entenderla es lo que te deja cuidarla.

## Lámina 03 · Pregunta 1 de 4
- Titular: ¿Qué pasa si dejo de aportar?
- Cuerpo: Si tu plan acumula valor, ese valor puede sostener tu protección un tiempo. Si es solo protección, depende de que sigas aportando.

## Lámina 04 · Pregunta 2 de 4
- Titular: ¿Qué cubre, además del fallecimiento?
- Cuerpo: Puede incluir incapacidad u otros beneficios adicionales. Solo cuenta lo que contrataste, y cada beneficio tiene su condición.

## Lámina 05 · Pregunta 3 de 4
- Titular: ¿Hasta cuándo dura?
- Cuerpo: Hay dos fechas que no siempre coinciden: hasta cuándo aportas y hasta cuándo estás protegido. Un beneficio adicional puede terminar antes que la protección principal.

## Lámina 06 · Pregunta 4 de 4
- Titular: ¿Qué recupero?
- Cuerpo: Si tu plan junta ahorro, importa cuánto y desde cuándo. Tomarlo puede bajar o terminar tu protección. Si es solo protección, no recupera: protege.

## Lámina 07 · Lo que se cuida
- Titular: Lo que se entiende, *se cuida.*
- Cuerpo: Sabes que es tu protector, lo vigilas y lo mantienes en orden.
- 01 Beneficiarios designados y al día.
- 02 Lo que declaraste al contratar.
- 03 Los papeles que pedirían y a quién llamar.
- Pie: Es lo que tu familia va a necesitar a la mano.

## Lámina 08 · Cierre
- Titular: Guárdalo
- Bajada: y hazle estas cuatro preguntas a tu asesor.
- 01 ¿Qué pasa si dejo de aportar?
- 02 ¿Qué cubre, además del fallecimiento?
- 03 ¿Hasta cuándo dura?
- 04 ¿Qué recupero?
- Puente (dato, sin pedir): En VAAV, cada asesor te lo explica con una herramienta propia: qué sí, qué no y bajo qué condición.
- Slogan: ✦ AI Financial Architects · El diferenciador VAAV
- Lockup VAAV.
- Aviso legal: Contenido educativo. VAAV SC no intermedia ni vende seguros. Cualquier contratación se realiza a través de un asesor con cédula profesional, a título individual.

## Caption · Instagram (vaavasesores)
Lo firmaste, lo archivaste y seguiste. Tu protección responde según tu contrato, la entiendas o no; entenderla es lo que te deja cuidarla.

Guárdalo para tu próxima revisión con tu asesor.

Contenido educativo. VAAV SC no intermedia ni vende seguros. Cualquier contratación se realiza a través de un asesor con cédula profesional, a título individual.

✦ AI Financial Architects · El diferenciador VAAV

#proteccionfamiliar #patrimonio #planeacionpatrimonial #empresarios

## Caption · LinkedIn perfil de Vic
Mucha gente firmó su protección, la archivó y siguió. No es descuido: nadie se lo explicó en su idioma.

La protección responde según el contrato, se entienda o no. Pero lo que se entiende, se cuida.

Te dejo las cuatro preguntas para hacerle a tu asesor. Guárdalo para tu próxima revisión.

Contenido educativo. VAAV SC no intermedia ni vende seguros. Cualquier contratación se realiza a través de un asesor con cédula profesional, a título individual.

✦ AI Financial Architects · El diferenciador VAAV

## Puntos abiertos
1. Nomenclatura: carpeta por slug (`carruseles/clientes-lo-que-ya-contrato/`), igual que el video hermano, en lugar de clave IG-PC-02 (regla de Vic del 29-sep-2026: claves que no se entienden fuera). Aplica la regla de videos a carruseles; se propone a Vic.
2. Fecha: después del Reel de la v2 (que todavía no se programa). Instagram 2 o 3 días después del Reel, 19:30; LinkedIn perfil otro día, 18:00. Se confirma contra lo programado en GHL.
3. El dato de Capgemini (57 % confía sin validar) ya salió en el newsletter del 17-oct: no se repite aquí; las láminas no llevan cifras.

## Auditoría (18-oct-2026, 22:45 MX)

- `verificar_mensaje.py --tipo publico --pista cliente --destinatario S3`: sin errores en láminas, caption de Instagram y caption de LinkedIn perfil.
- Filtro de cliente de `master-traductor` (modo pieza pública): sin producto ni aseguradora, sin cifras, capital con su contrapartida ("tomarlo puede bajar o terminar tu protección"), dejar de aportar sin venderlo como opción, relojes de aporte y protección separados, incapacidad junto a fallecimiento, regla 8 con su condición ("según tu contrato").
- `vaav-canon-guardian`: audiencia cliente protección (S3 y S1), momento M3 (lo delata "hazle estas cuatro preguntas a tu asesor"). Veredicto **Verde**. Compliance Verde (sin marca, sin promesas absolutas, sin fiscal, sin cifras, sin descalificar colegas, vocabulario de nicho limpio, sin markdown en captions).
- Corregido en la revisión: slogan agregado al caption de Instagram; lámina 07 sin "completo" (se leía ambiguo); lámina 05 dice "antes que la protección principal".
- Aviso de canon, no de pieza: `canon-ctas-headlines.md` (override 13-jun) todavía pide diagnóstico privado y palabra clave en el perfil de Vic; la regla de Vic del 8-oct-2026 (sin "escríbeme" ni palabra clave) es posterior y es la que sigue el video hermano. Falta asentarla en ese canon.
- Aceptado por decisión previa de Vic: "nadie te lo explicó en tu idioma" (2 de 4 lectores lo leen como culpa del asesor anterior; "en tu idioma" lo suaviza, guion del 15-oct).

## Crítica de diseño (sistema v3, 18-oct-2026)

Diales (design-taste, pieza estática de redes): variación 6, movimiento 1, densidad 3. Skills usadas desde el diseño: design-taste-frontend (sección 15), impeccable (craft-floor, critique y detector), apple-design (tracking por tamaño). El arreglo va al motor (`gen_carrusel_v3.py`), no a las láminas.

| Antes | Después | Por qué |
|---|---|---|
| v2: Cormorant en todos los titulares, foto oscura en todas las láminas | Inter 800 con tracking por tamaño; Cormorant itálica solo en "en tu idioma."; foto solo en portada (cajón archivado), lámina 02 (sobre sellado) y 07 (escritorio en orden) | La imagen cuenta la historia (archivado, sin abrir, en orden); en las preguntas manda la tipografía |
| Primer render: "lo" rojo partido al final del renglón de portada | Salto fijo: "¿Sabes qué cubre / lo que ya contrataste?" | El énfasis se lee completo |
| Primer render: pie "8 láminas. Criterio VAAV." encima del cajón | Portada sin pie y bajada en dos renglones | Competía con la foto y con el lockup (impeccable distill) |
| Primer render: banda de la 02 sin el sello | Encuadre al 84 % para que se vea el sello rojo | El sobre sellado es la imagen de "nadie te lo explicó" |
| Primer render: "Pregunta 1 de 4" como rótulo encima del titular | Pie funcional con icono, junto a "Desliza" | impeccable craft-floor: kicker sobre el titular prohibido |
| Preguntas con medio lienzo vacío | Icono grande en diagonal, arriba o abajo según la composición | Equilibrio sin agregar texto; las preguntas alternan composición |
| Tracking -0.042em en 110 px o más | -0.04em como máximo | Piso de impeccable |

Detector de impeccable (una corrida, 8 HTML): 2 hallazgos que se quedan con razón: Inter "sobreusada" (fuente de marca) y "padding apretado" en la 07 (foto a sangre; texto a 80 px).
`verificar_imagenes.py --medida 1080x1350 --canal instagram`: 8 sin errores automáticos; hoja de revisión inspeccionada a tamaño celular.
