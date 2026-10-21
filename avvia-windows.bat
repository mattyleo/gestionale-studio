@echo off
chcp 65001 >nul
title Gestionale Studio - Dott. Antonio Tuzio
color 0A

cd /d "%~dp0"

echo =======================================================================
echo          AVVIO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

echo [1/2] Verifica e avvio database PostgreSQL...
docker compose up -d postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENZIONE] Docker Desktop non sembra avviato.
    echo Avvia prima Docker Desktop e riprova.
    pause
    exit /b 1
)
echo [OK] Database attivo su porta 5432.

echo.
echo [2/2] Apertura del browser su http://localhost:3000...
start "" "http://localhost:3000"

echo.
echo =======================================================================
echo   Il gestionale e' in funzione!
echo   Indirizzo Locale:  http://localhost:3000
echo.
echo   Per accedere dagli altri PC o Mac dello studio collegati alla stessa
echo   rete Wi-Fi/LAN, apri il browser e digita:
echo   http://[IP-DI-QUESTO-PC]:3000
echo.
echo   Per terminare il programma chiudi questa finestra.
echo =======================================================================
echo.

npm run start
if %ERRORLEVEL% NEQ 0 (
    echo Tentativo di avvio in modalita' standard (npm run dev)...
    npm run dev
)

pause
