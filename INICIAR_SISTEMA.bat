@echo off
setlocal
cd /d "%~dp0"
title Sistema de Almoxarifado - Regional Umuarama

echo ======================================================
echo    SISTEMA DE ALMOXARIFADO REGIONAL - R6
echo ======================================================
echo.

:: 1. Verifica Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado! 
    echo Por favor, instale o Node.js em https://nodejs.org/
    echo.
    pause
    exit
)

:: 2. Verifica dependencias
if not exist node_modules (
    echo [INFO] Instalando dependencias (primeira execucao)...
    echo Isso pode levar alguns minutos e requer internet...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit
    )
)

:: 3. Verifica Build (Producao)
if not exist dist (
    echo [INFO] Compilando sistema para melhor performance...
    call npm run build
)

echo.
echo [SUCESSO] O sistema esta pronto.
echo.
echo ======================================================
echo   ACESSE NO NAVEGADOR: http://localhost:3000
echo ======================================================
echo.
echo (Mantenha esta janela aberta enquanto usa o sistema)
echo.

:: Inicia em modo producao se o build existir, senao usa dev
if exist dist (
    npm start
) else (
    npm run dev
)

pause
