# Hospedaje de imágenes y programación en GoHighLevel

## Por qué hospedar
El planificador de GHL manda a Instagram la URL de cada imagen; Instagram la descarga. Necesita URL pública, estable y JPEG. PNG falla en la API de Instagram.

## Repo de assets
- Repo: `vicmeza1/vicmeza-techstudio`, rama `main`.
- Ruta: `instagram-vaav/<año>-<serie>/<CODIGO>/<CODIGO>-0N.jpg` (ejemplo: `instagram-vaav/2026-patrimonio/IG-CP-01/IG-CP-01-01.jpg`). La serie de reclutamiento vive en `instagram-vaav/2026-reclutamiento/IG-00N/`.
- Junto a las imágenes va `<CODIGO>-textos.md` (textos auditados y caption), para que la pieza sea auditable después. Los fondos Higgsfield de referencia van en `<CODIGO>/fondos/`.
- URL pública: `https://raw.githubusercontent.com/vicmeza1/vicmeza-techstudio/main/<ruta>`.
- Verificar antes de programar: `curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" <url>` debe dar `200 image/jpeg` en las N imágenes.
- Desde Cowork sin git: el MCP de GitHub (`push_files`) solo acepta texto; para binarios usar `git` en la Mac o pedir a Claude Code que lo suba.

## Cuentas en GHL (location 8Ff7QFVcGLog6t5ykip4)
- Instagram `vaavasesores`: `6949d7315517e540ae337331_8Ff7QFVcGLog6t5ykip4_17841407314827288` (token vigente hasta 2026-11-01).
- Facebook página VAAV: `6949d7524691325a3d00b2a4_8Ff7QFVcGLog6t5ykip4_568181103345664_page` (token expirado en marzo 2026; reconectar antes de usar).
- LinkedIn página VAAV: `6949d6fbad86eb5cdde7e01c_8Ff7QFVcGLog6t5ykip4_18915823_page`.
- LinkedIn perfil Vic: `6949d6fbad86eb5cdde7e01c_8Ff7QFVcGLog6t5ykip4_AbEgNWPiPN_profile`.
- Grupo "Grupo Mkt 1" (FB + IG + LinkedIn página): `695ecc3c2c17e4e206193a52`.
- userId de Vic para `createdBy` / `userId`: `hpUpR9TlF76tSTRCbaUr`.
Confirmar siempre con `social-media-posting_get-account` porque los ids cambian al reconectar.

## Crear el post
`social-media-posting_create-post` con:
- `body_accountIds`: [id de Instagram]
- `body_type`: `post` · `body_status`: `scheduled`
- `body_userId` y `body_createdBy`: userId de Vic
- `body_scheduleDate`: ISO UTC con milisegundos, ej. `2026-09-03T02:30:00.000Z` (20:30 CDMX; CDMX es UTC-6 todo el año)
- `body_summary`: caption auditado literal
- `body_media`: `[{"url": "...01.jpg", "type": "image/jpeg"}, ...]` en orden
Horario habitual VAAV: 19:00 a 20:30 CDMX. Reportar `_id` del post y hora CDMX.

## Problema conocido
`social-media-posting_edit-post` del MCP declara `body_type` y `body_status` como objeto y la llamada falla al serializar. Para cambiar hora: crear un post nuevo con `create-post` y pedirle a Vic que borre el anterior en Marketing → Social Planner, dando el `_id` de ambos.

## Si el post marca failed
Casi siempre es token de Instagram vencido o URL no pública. Revisar `get-post` con el id; reconectar la cuenta en el Social Planner; verificar las URLs con curl.
