@echo off
chcp 65001 >nul
title Svetopis — lichnaya mediateka
cd /d "%~dp0"

echo.
echo   ========================================
echo     SVETOPIs' — lichnaya mediateka
echo   ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   [!] Node.js ne naiden v sisteme.
    echo       Skachaite i ustanovite s https://nodejs.org
    echo       i zapustite etot fail povtorno.
    echo.
    pause
    exit /b 1
)

if not exist node_modules (
    echo   [*] Pervyi zapusk — ustanavlivaem zavisimosti...
    echo.
    call npm install
    if errorlevel 1 (
        echo   [!] Ne udalos' ustanovit' zavisimosti.
        pause
        exit /b 1
    )
    echo.
)

echo   [*] Zapusk servera...
echo   [*] Sait otkroetsia avtomaticheski: http://localhost:5173
echo   [*] Chtoby ostanovit' — zakroite eto okno (Ctrl+C).
echo.

start "" http://localhost:5173
call npm run dev
