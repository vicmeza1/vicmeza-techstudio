#!/bin/bash
# build-skill.sh v2 — VAAV universal builder
# - Detecta SKILL.md o SKILL-{nombre}.md
# - Empaca references/, scripts/, templates/, assets/, themes/
# - Empaca _shared/ desde ../../_shared/ (canon transversal VAAV)
# - Reescribe ../../_shared/ → _shared/ en SKILL.md + references al empacar
# - Empaqueta como .skill (ZIP plano, sin dependencias externas)
# Uso: bash build-skill.sh
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_NAME="$(basename "$SKILL_DIR")"

# 1) Localizar SKILL.md o SKILL-{nombre}.md
# NOTA VAAV (04-ago-2026): esta carpeta TENIA dos archivos, SKILL.md (version vieja,
# arquitectura Chrome MCP FASE 0-6) y SKILL-linkedin-invite.md (vigente, Dripify).
# Este builder forzaba la vigente, pero el plugin del marketplace seguia cargando la
# vieja: dos rutas de distribucion sirviendo skills distintas. El SKILL.md viejo se
# elimino el mismo dia del vault y del plugin; queda un solo archivo vigente y esta
# rama ya es redundante, se conserva por seguridad.
# El builder anterior escaneaba ~/Library completo (todo Google Drive) y colgaba; se
# reemplazo por este, el universal que usan los otros 24 skills.
if [ -f "$SKILL_DIR/SKILL-linkedin-invite.md" ]; then
    SKILL_SRC="$SKILL_DIR/SKILL-linkedin-invite.md"
elif [ -f "$SKILL_DIR/SKILL.md" ]; then
    SKILL_SRC="$SKILL_DIR/SKILL.md"
else
    echo "❌ No se encontró SKILL.md ni SKILL-*.md en $SKILL_DIR"
    exit 1
fi

# 2) Localizar _shared transversal del vault
SHARED_DIR=""
if [ -d "$SKILL_DIR/../../_shared" ]; then
    SHARED_DIR="$(cd "$SKILL_DIR/../../_shared" && pwd)"
fi

# 3) Stage temporal
BUILD_DIR="$(mktemp -d -t "${SKILL_NAME}-build.XXXXXX")"
STAGE="$BUILD_DIR/$SKILL_NAME"
mkdir -p "$STAGE"

echo "📦 Empacando $SKILL_NAME..."
echo "   ↪ Fuente: $(basename "$SKILL_SRC")"

# 4) Copiar SKILL.md reescribiendo paths ../../_shared/ → _shared/
sed 's|\.\./\.\./_shared/|_shared/|g' "$SKILL_SRC" > "$STAGE/SKILL.md"

# 5) Copiar sub-folders del skill (y reescribir paths dentro)
for sub in references scripts templates assets themes; do
    if [ -d "$SKILL_DIR/$sub" ]; then
        cp -r "$SKILL_DIR/$sub" "$STAGE/"
        # Reescribir paths _shared en cualquier .md interno
        find "$STAGE/$sub" -type f -name "*.md" | while IFS= read -r mdfile; do
            sed -i.bak 's|\.\./\.\./_shared/|_shared/|g' "$mdfile" 2>/dev/null || true
            rm -f "${mdfile}.bak"
        done
    fi
done

# 6) Empacar _shared/ si existe en el vault
if [ -n "$SHARED_DIR" ] && [ -d "$SHARED_DIR" ]; then
    cp -r "${VAAV_SHARED_CACHE:-$SHARED_DIR}" "$STAGE/_shared"
    # El log de ingenieria del vault NO viaja al asesor (10-ago-2026): son ~98
    # lineas de decisiones internas, con nombres de cliente adentro. Util en el
    # vault, ruido y exposicion dentro de un bundle que se instala en la maquina
    # de alguien mas. Se borra del STAGE temporal; el original nunca se toca.
    rm -f "$STAGE/_shared/references/log.md" "$STAGE/_shared/references/changelog-"*.md "$STAGE/_shared/references/insignia-comisiones-"*.md
    refs_count=$(ls "$STAGE/_shared/references" 2>/dev/null | wc -l | tr -d ' ')
    echo "   ↪ Incluido _shared/ ($refs_count archivos en references)"
fi

# 7) Limpiar artefactos
find "$STAGE" -name ".DS_Store" -delete 2>/dev/null || true
find "$STAGE" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$STAGE" -name "*.pyc" -delete 2>/dev/null || true
find "$STAGE" -name "*.bak" -delete 2>/dev/null || true

# 8) Empaquetar como ZIP renombrado .skill
OUTPUT="$SKILL_DIR/$SKILL_NAME.skill"
# VAAV_ZIP_TMP: se empaca en el temporal y se copia encima. zip no puede reemplazar
# un archivo en carpetas montadas donde rm está bloqueado; cp sí.
TMPZIP="$BUILD_DIR/$SKILL_NAME.skill"
(cd "$BUILD_DIR" && zip -rq "$TMPZIP" "$SKILL_NAME")
cp -f "$TMPZIP" "$OUTPUT"

# 9) Cleanup
rm -rf "$BUILD_DIR"

echo "✅ $SKILL_NAME.skill listo ($(du -h "$OUTPUT" | cut -f1))"
