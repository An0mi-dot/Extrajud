@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM ═══════════════════════════════════════════════════════════════
REM  EXTRATJUD - Inicia o app
REM  Duplo-clique para abrir
REM ═══════════════════════════════════════════════════════════════

echo Abrindo EXTRATJUD...
echo.

REM Configurar PATH localmente para esta sessao
set PATH=%CD%\node_bin;%CD%\node_bin\node_modules\.bin;%PATH%

REM Chamar npm start com CALL
call npm start

if errorlevel 1 (
    echo.
    echo ERRO: Falha ao iniciar o app
    echo Certifique-se de rodar setup_env.bat primeiro!
    echo.
)

pause
