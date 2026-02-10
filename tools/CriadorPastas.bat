@echo off
title Criador de Pastas (PJE/SharePoint)
echo Iniciando ferramenta...
node "%~dp0criador_pastas_standalone.js"
if %errorlevel% neq 0 (
    echo.
    echo Ocorreu um erro na execucao.
    pause
)
pause