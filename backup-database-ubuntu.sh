#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Backup Database Gestionale Studio per Ubuntu Linux
# ─────────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

mkdir -p backups

TIMESTAMP=$(date +"%Y%m%d_%H%M")
BACKUP_FILE="backups/backup_fattura_studio_${TIMESTAMP}.sql"

echo "======================================================================="
echo "       BACKUP DATABASE - GESTIONALE STUDIO PROFESSIONALE"
echo "======================================================================="
echo ""
echo "Salvataggio in corso su: $BACKUP_FILE ..."

if docker ps >/dev/null 2>&1; then
    docker exec -t fattura-studio-db pg_dump -U postgres -d fattura_studio -F p > "$BACKUP_FILE"
else
    sudo docker exec -t fattura-studio-db pg_dump -U postgres -d fattura_studio -F p > "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCCESSO] Copia di sicurezza creata con successo!"
    echo "File generato: $BACKUP_FILE"
    echo "Dimensioni: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo ""
    echo "[ERRORE] Impossibile creare il backup. Assicurati che il database sia attivo."
fi
