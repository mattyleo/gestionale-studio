#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Crea Icona di Avvio sul Desktop e nel Menu Applicazioni (Ubuntu/Linux)
# ─────────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ICON_PATH="$DIR/public/favicon.ico"
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="accessories-calculator"
fi

DESKTOP_CONTENT="[Desktop Entry]
Version=1.0
Type=Application
Name=Gestionale Studio Tuzio
GenericName=Fatturazione e Gestione Studio
Comment=Avvia il gestionale dello studio e apre il browser
Exec=$DIR/avvia-ubuntu.sh
Icon=$ICON_PATH
Path=$DIR
Terminal=true
StartupNotify=true
Categories=Office;Finance;
"

# 1. Installa nel menu Applicazioni di sistema (ricercabile con tasto Super/Windows)
APPS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPS_DIR"
echo "$DESKTOP_CONTENT" > "$APPS_DIR/gestionale-studio.desktop"
chmod +x "$APPS_DIR/gestionale-studio.desktop"
update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true

# 2. Installa sulla Scrivania / Desktop
CREATED_COUNT=0
for TARGET_DIR in "$HOME/Desktop" "$HOME/Scrivania"; do
    if [ -d "$TARGET_DIR" ]; then
        DEST="$TARGET_DIR/Gestionale-Studio.desktop"
        echo "$DESKTOP_CONTENT" > "$DEST"
        chmod +x "$DEST"
        gio set "$DEST" metadata::trusted true >/dev/null 2>&1 || true
        CREATED_COUNT=$((CREATED_COUNT + 1))
        echo " -> Creato collegamento su: $DEST"
    fi
done

echo ""
echo "======================================================================="
echo "  COLLEGAMENTO DESKTOP CREATO CON SUCCESSO!"
echo "======================================================================="
echo ""
echo "1. Ora hai l'icona 'Gestionale Studio Tuzio' direttamente sul Desktop."
echo "2. È disponibile anche nel menu Applicazioni (cerca 'Gestionale Studio')"
echo "   e puoi aggiungerla alla barra laterale (Dock) con tasto destro -> Aggiungi ai preferiti."
echo ""
echo "NOTA PER UBUNTU:"
echo "Se al primo doppio clic l'icona sul Desktop mostra una rotellina o un avviso,"
echo "fai clic con il TASTO DESTRO sull'icona e scegli: 'Consenti esecuzione' ('Allow Launching')."
echo "Da quel momento si avvierà sempre con un semplice doppio clic!"
echo "======================================================================="
