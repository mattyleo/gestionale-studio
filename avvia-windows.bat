@echo off
chcp 65001 >nul
title Gestionale Studio - Dott. Antonio Tuzio
color 0A

cd /d "%~dp0"

echo =======================================================================
echo          AVVIO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

echo [1/3] Verifica e avvio motore Docker e database PostgreSQL...
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Docker Desktop non e' in esecuzione. Avvio automatico in corso...
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo [INFO] Attesa che il motore Docker sia pronto (puo' richiedere 15-30 secondi)...
    set /a _wait_count=0
    goto :attendi_docker
)
goto :docker_avviato

:attendi_docker
timeout /t 2 /nobreak >nul
docker info >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :docker_avviato
set /a _wait_count+=1
<nul set /p=.
if %_wait_count% GEQ 45 (
    echo.
    echo [ERRORE] Timeout: Docker Desktop non ha risposto entro 90 secondi.
    echo Assicurati che Docker Desktop sia installato e funzionante.
    pause
    exit /b 1
)
goto :attendi_docker

:docker_avviato
echo.
docker compose up -d postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Impossibile avviare il container PostgreSQL con docker compose.
    pause
    exit /b 1
)
echo [OK] Database PostgreSQL attivo su porta 5432.

echo.
echo [2/3] Allineamento schema database...
call npx prisma db push --skip-generate >nul 2>&1

echo.
echo [3/3] Apertura del browser su http://localhost:3000...
start "" "http://localhost:3000"

echo.
echo =======================================================================
echo   Il gestionale e' in funzione!
echo   Indirizzo:  http://localhost:3000
echo.
echo   Login:  infooizut@gmail.com
echo.
echo   Per terminare il programma chiudi questa finestra.
echo =======================================================================
echo.

npm run dev
pause
