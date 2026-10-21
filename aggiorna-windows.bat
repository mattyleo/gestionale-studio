@echo off
REM ─────────────────────────────────────────────────────────────
REM Aggiornamento Automatico Gestionale Studio per Windows
REM ─────────────────────────────────────────────────────────────
setlocal enabledelayedexpansion

echo =======================================================================
echo        AGGIORNAMENTO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

if not exist ".git" (
    echo [!] Questo gestionale non e' stato clonato da Git.
    echo     Per abilitare gli aggiornamenti automatici, collega il progetto a GitHub/GitLab.
    pause
    exit /b 1
)

echo [1/4] Download delle ultime modifiche da Git...
git pull
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Impossibile scaricare le modifiche. Verifica la connessione Internet.
    pause
    exit /b 1
)

echo.
echo [2/4] Installazione dipendenze...
call npm install

echo.
echo [3/4] Aggiornamento schema database (dati esistenti preservati)...
call npx prisma generate
call npx prisma db push

echo.
echo [4/4] Ricompilazione applicazione per la produzione...
call npm run build

echo.
echo =======================================================================
echo              AGGIORNAMENTO COMPLETATO CON SUCCESSO!
echo =======================================================================
echo.
pause
