---
pieza: IG-RC-01
canal: Instagram (página VAAV)
destinatario: R (quien ya vende seguros, crédito o inversión)
fecha: 2026-09-20
---

# IG-RC-01 · Dijo que sí. Después, silencio.

Primera pieza de la serie nueva de reclutamiento en Instagram. Sustituye a la serie IG-013 a IG-030,
que mezclaba lectores y no declaraba a quién le hablaba.

## Láminas

1. Portada. Kicker: "Si ya vendes seguros, crédito o inversión". Titular: "Dijo que sí. Después, silencio."
   ("silencio" sobre bloque rojo). Bajada: "No fue el precio." Burbuja de chat cortada por el borde.
2. La reunión salió bien. El cliente quedó convencido. La propuesta llegó dos semanas después, y para
   entonces ya no contestaba.
3. No fue falta de talento. Fue el tiempo entre la reunión y la propuesta. Ese tiempo lo llenas tú, a mano,
   con tu tiempo libre.
4. Todos tienen acceso a la misma IA. La diferencia es el criterio con el que trabaja. La nuestra trabaja
   con veinte años sentados con empresarios. No es un curso: te la entregamos hecha.
5. Con VAAV pasa esto. El diagnóstico: nuestra app con IA te ayuda a hacerlo, según el perfil de tu cliente.
   La propuesta: te la generamos, y llegas a la reunión de cierre con ella lista. Si cerraste: tu cliente
   recibe la explicación de su póliza, personalizada y en formato VAAV, generada con IA en minutos.
   Pie: frente al empresario te presentas como firma, no como agente.
6. Si te acercas a VAAV, no te lo explicamos: te lo enseñamos. En la plática ves un caso real, con los datos
   cambiados, de principio a fin. No es para quien busca un guion.
7. Si te interesa, empezamos con una plática de una hora. Sin currículum y sin examen. Escríbenos ASESOR
   por mensaje directo.

Son las 7 láminas aprobadas por Vic, sin agregados. El 20-sep-2026 se armó una versión de 9 con copy reescrito y Vic la rechazó: el texto aprobado se usa literal.

## Caption (sin hashtags, enmienda 20-sep-2026)

Para quien ya vende seguros, crédito o inversión.

El cliente dijo que sí en la reunión. La propuesta llegó dos semanas después y ya no contestó. No fue el
precio ni el talento: fue todo lo que hiciste a mano en medio.

Todos tienen acceso a la misma IA. La diferencia es el criterio con el que trabaja.

Con VAAV, el diagnóstico lo haces con nuestra app, la propuesta te la generamos y, si cierras, tu cliente
recibe la explicación de su póliza en minutos.

Si te interesa, escríbenos ASESOR por mensaje directo.

✦ AI Financial Architects · El diferenciador VAAV

## Título descriptivo

Por qué se enfría el cliente entre la reunión y la propuesta

## Reel

`IG-RC-01-reel.mp4`, 22 s, sin música, hecho con `_shared/scripts/reel_vaav.py`. Escenas dibujadas por
código porque Higgsfield estaba sin créditos el 20-sep-2026. Se regenera con
`python3 reel_vaav.py --fondos e1.jpg e2.jpg e3.jpg` cuando haya escenas del modelo.

## Verificación

`verificar_mensaje.py --tipo publico --pista reclutamiento --destinatario R`: sin errores en caption y láminas.


## Producción (20-sep-2026)
- Fondos: 9 generados con la API de Higgsfield (recraft 4:5) más 3 en 9:16 para el Reel, en `fondos/` y `fondos-reel/`, con su `generar.sh` y `prompts.txt`.
- Láminas: `laminas/IG-RC-01-01..07.jpg` más hoja de contacto. Render en la Mac con Playwright ya instalado.
- Reel: `IG-RC-01-reel.mp4`, 32 s, con las escenas de Higgsfield y cama sonora propia.
- En `_to_delete/` quedaron dos láminas de la versión rechazada de 9; bórralas cuando quieras.
