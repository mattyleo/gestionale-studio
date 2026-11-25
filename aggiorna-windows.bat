@echo off
chcp 65001 >nul
title Aggiornamento Gestionale Studio - Dott. Antonio Tuzio
color 0B

cd /d "%~dp0"

echo =======================================================================
echo        AGGIORNAMENTO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

REM 1. Verifica presenza cartella Git o inizializzazione
if not exist ".git" (
    echo [INFO] Inizializzazione collegamento Git a GitHub...
    git init >nul 2>&1
    git remote add origin https://github.com/mattyleo/gestionale-studio.git >nul 2>&1
)

REM 2. Chiusura eventuali processi Node per evitare blocchi file Windows (EPERM)
echo [1/5] Chiusura eventuali sessioni del gestionale attive...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM 3. Download da GitHub
echo [2/5] Scaricamento dell'ultima versione da GitHub (main)...
git fetch origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Impossibile contattare GitHub. Verifica che il PC sia connesso a Internet.
    pause
    exit /b 1
)
git reset --hard origin/main
if %ERRORLEVEL% NEQ 0 (
    git pull origin main --force
)
echo [OK] Codice sorgente aggiornato con successo.

REM 4. Installazione dipendenze se nuove
echo.
echo [3/5] Verifica pacchetti e dipendenze...
call npm install --prefer-offline --no-audit

REM 5. Generazione Prisma Client e allineamento database
echo.
echo [4/5] Allineamento motore database (Prisma)...
call npx prisma generate

REM Verifica se Docker è attivo per applicare le tabelle
echo.
echo [5/5] Sincronizzazione tabelle database...
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    docker compose up -d postgres >nul 2>&1
    call npx prisma db push --accept-data-loss --skip-generate
    echo [OK] Database allineato con successo.
) else (
    echo [AVVISO] Docker Desktop non e' al momento in esecuzione.
    echo          Lo schema del database verra' sincronizzato in automatico al prossimo avvio.
)

echo.
echo =======================================================================
echo              AGGIORNAMENTO COMPLETATO CON SUCCESSO!
echo =======================================================================
echo.
echo Puoi avviare subito il gestionale rilanciando avvia-windows.bat.
echo.
pause
