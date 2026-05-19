@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

REM ═══════════════════════════════════════════════════════════════
REM  EXTRATJUD - Setup Simples
REM  Duplo-clique para rodar e depois "npm start" para abrir o app
REM ═══════════════════════════════════════════════════════════════

echo.
echo Configurando ambiente...
echo.

REM Criar pasta node_bin se nao existir
if not exist "node_bin" (
    echo Criando pasta node_bin...
    mkdir node_bin
)

REM Verificar se node.exe ja existe
if exist "node_bin\node.exe" (
    echo ✓ Node.js encontrado em node_bin\
    goto CONFIGURE
)

REM Tentar baixar Node.js
echo.
echo Baixando Node.js v20.11.0...
echo.

powershell -NoProfile -Command "& {$ProgressPreference='SilentlyContinue'; try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile 'node_bin\node.zip' -TimeoutSec 60; exit 0 } catch { exit 1 }}"

if errorlevel 1 (
    echo ERRO: Nao consegui baixar Node.js
    echo.
    echo Opcoes:
    echo 1. Verifique sua conexao internet
    echo 2. Baixe manualmente em:
    echo    https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip
    echo 3. Descompacte em: %CD%\node_bin\
    echo 4. Execute este script novamente
    echo.
    pause
    goto :EOF
)

echo ✓ Download concluido!
echo.
echo Extraindo Node.js...

REM Extrair com PowerShell
powershell -NoProfile -Command "& {Add-Type -Assembly 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::ExtractToDirectory('node_bin\node.zip', 'node_bin')}"

if errorlevel 1 (
    echo ERRO: Nao consegui extrair
    echo.
    pause
    goto :EOF
)

REM Reorganizar se necessario
for /d %%D in (node_bin\node-v*) do (
    echo Organizando arquivos...
    for /f "delims=" %%F in ('dir /b "%%D"') do (
        move "%%D\%%F" "node_bin\" >nul 2>&1
    )
    rmdir "%%D" >nul 2>&1
)

REM Deletar zip
if exist "node_bin\node.zip" del "node_bin\node.zip"

echo ✓ Node.js extraido!
echo.

REM ═══════════════════════════════════════════════════════════════
REM  Configurar e instalar dependencias
REM ═══════════════════════════════════════════════════════════════

:CONFIGURE

set PATH=%CD%\node_bin;%CD%\node_bin\node_modules\.bin;%PATH%

REM Persistir no PATH global para proximos prompts
setx PATH "%CD%\node_bin;%CD%\node_bin\node_modules\.bin;%PATH%"

REM Verificar se node e npm funcionam
if not exist "node_bin\node.exe" (
    echo ERRO: node.exe nao encontrado
    echo.
    pause
    goto :EOF
)

echo Versoes:
echo.
node --version
npm --version
echo.

echo Instalando dependencias...
call npm install

if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    echo.
    pause
    goto :EOF
)

echo.
echo ✓ Pronto!
echo.
echo Use um dos metodos abaixo:
echo.
echo 1. Duplo-clique em: start_app.bat
echo    OU
echo 2. Abra um novo prompt e execute: npm start
echo.
echo Obs: o PATH foi atualizado globalmente
echo Proximos prompts ja terao npm disponivel!
echo.
pause
