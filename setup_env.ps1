# ═══════════════════════════════════════════════════════════════
# EXTRATJUD - Setup Ambiente Local (PowerShell)
# Uso: powershell -ExecutionPolicy Bypass -File setup_env.ps1
# ═══════════════════════════════════════════════════════════════

param(
    [switch]$SkipNodeDownload = $false,
    [string]$NodeVersion = "v20.11.0"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    EXTRATJUD - Configuração de Ambiente Local (PowerShell)     ║" -ForegroundColor Cyan
Write-Host "║                 (Para máquinas sem npm global)                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ═══════════════════════════════════════════════════════════════
# Função: Download com retry
# ═══════════════════════════════════════════════════════════════

function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath,
        [int]$MaxRetries = 3
    )
    
    $retryCount = 0
    while ($retryCount -lt $MaxRetries) {
        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
            Write-Host "✓ Download concluído!" -ForegroundColor Green
            return $true
        }
        catch {
            $retryCount++
            if ($retryCount -lt $MaxRetries) {
                Write-Host "⚠️  Tentativa $retryCount falhou, tentando novamente..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            } else {
                Write-Host "❌ Download falhou após $MaxRetries tentativas" -ForegroundColor Red
                return $false
            }
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# Verificar se node_modules já existe
# ═══════════════════════════════════════════════════════════════

if (Test-Path "node_modules") {
    Write-Host "✓ node_modules já existe" -ForegroundColor Green
    Write-Host ""
} else {
    # Criar diretório node_bin
    if (-not (Test-Path "node_bin")) {
        Write-Host "📁 Criando pasta node_bin..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path "node_bin" | Out-Null
    }

    # ═══════════════════════════════════════════════════════════════
    # Download Node.js
    # ═══════════════════════════════════════════════════════════════

    if (-not $SkipNodeDownload) {
        Write-Host "`n📥 Tentando baixar Node.js portável..." -ForegroundColor Cyan
        Write-Host ""

        $nodeUrl = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"
        $nodePath = "node_bin\node.zip"

        if (Download-File -Url $nodeUrl -OutputPath $nodePath) {
            Write-Host "`n📦 Extraindo Node.js..." -ForegroundColor Cyan

            # Extrair com .NET (mais confiável)
            try {
                Add-Type -Assembly 'System.IO.Compression.FileSystem'
                [IO.Compression.ZipFile]::ExtractToDirectory($nodePath, "node_bin")

                # Se foi extraído em subpasta, mover para raiz
                $subdirs = Get-ChildItem "node_bin" -Directory
                foreach ($dir in $subdirs) {
                    if ($dir.Name -match "node-v") {
                        Get-ChildItem -Path $dir.FullName -Recurse | Move-Item -Destination "node_bin\" -Force
                        Remove-Item $dir.FullName -Force -Recurse
                    }
                }

                Write-Host "✓ Node.js extraído!" -ForegroundColor Green
                Remove-Item $nodePath -Force
            }
            catch {
                Write-Host "❌ Falha ao extrair: $_" -ForegroundColor Red
                Write-Host "`n💡 Tente extrair manualmente:" -ForegroundColor Yellow
                Write-Host "   Arquivo: $nodePath"
                Write-Host "   Para: node_bin\"
                exit 1
            }
        } else {
            Write-Host "`n💡 Download falhou. Opções:" -ForegroundColor Yellow
            Write-Host "   1. Verificar conexão internet"
            Write-Host "   2. Download manual: https://nodejs.org/dist/$NodeVersion/"
            Write-Host "   3. Extrair em: node_bin\"
            Write-Host ""
            exit 1
        }
    }
}

# ═══════════════════════════════════════════════════════════════
# Configurar PATH
# ═══════════════════════════════════════════════════════════════

Write-Host "`n🔧 Configurando ambiente..." -ForegroundColor Cyan
Write-Host ""

$env:PATH = "$scriptDir\node_bin;$scriptDir\node_bin\node_modules\.bin;$env:PATH"

# Verificar node.exe
if (Test-Path "node_bin\node.exe") {
    Write-Host "✓ Node.js encontrado:" -ForegroundColor Green
    & ".\node_bin\node.exe" --version
} else {
    Write-Host "❌ Erro: node.exe não encontrado em node_bin\" -ForegroundColor Red
    Write-Host "`n💡 Certifique-se de extrair Node.js corretamente:" -ForegroundColor Yellow
    Write-Host "   • https://nodejs.org/en/download/"
    Write-Host "   • Extrair em: node_bin\"
    exit 1
}

# Verificar npm
if (Test-Path "node_bin\npm.cmd") {
    Write-Host "`n✓ npm encontrado:" -ForegroundColor Green
    & ".\node_bin\npm.cmd" --version
} else {
    Write-Host "`n❌ Erro: npm não encontrado" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════
# Instalar dependências
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📚 Instalando dependências (npm install)..." -ForegroundColor Cyan
Write-Host ""

$npmCmd = ".\node_bin\npm.cmd"
& $npmCmd install

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Erro durante npm install!" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════
# Criar scripts de atalho
# ═══════════════════════════════════════════════════════════════

Write-Host "`n📝 Criando scripts de atalho..." -ForegroundColor Cyan

# start_dev.bat
@"
@echo off
set PATH=$scriptDir\node_bin;$scriptDir\node_bin\node_modules\.bin;%PATH%
cd /d "%~dp0"
npm start
"@ | Out-File -FilePath "start_dev.bat" -Encoding ASCII -Force

# start_dev.ps1
@"
`$env:PATH = "$scriptDir\node_bin;$scriptDir\node_bin\node_modules\.bin;`$env:PATH"
Set-Location `$PSScriptRoot
npm start
"@ | Out-File -FilePath "start_dev.ps1" -Encoding UTF8 -Force

Write-Host "✓ Scripts criados: start_dev.bat e start_dev.ps1" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════
# Resumo final
# ═══════════════════════════════════════════════════════════════

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    ✅ SETUP CONCLUÍDO!                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🚀 Para iniciar o app:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Opção 1 (Recomendado):" -ForegroundColor Yellow
Write-Host "     → Duplo-clique em: start_dev.bat" -ForegroundColor White
Write-Host ""
Write-Host "   Opção 2 (Terminal - Batch):" -ForegroundColor Yellow
Write-Host "     → npm start" -ForegroundColor White
Write-Host ""
Write-Host "   Opção 3 (Terminal - PowerShell):" -ForegroundColor Yellow
Write-Host "     → npm start" -ForegroundColor White
Write-Host ""

Write-Host "📦 Para compilar instalador:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   → npm run dist" -ForegroundColor White
Write-Host ""

Write-Host "📝 Notas importantes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   • node_bin\ contém Node.js local (NÃO versionar)" -ForegroundColor Gray
Write-Host "   • Adicione a .gitignore: node_bin/" -ForegroundColor Gray
Write-Host "   • Para máquina nova, execute este script novamente" -ForegroundColor Gray
Write-Host "   • Documentação: docs/ ou README.md" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Seu ambiente está pronto para desenvolvimento!" -ForegroundColor Green
Write-Host ""

# Deixar terminal aberto no PowerShell
if ($PSVersionTable.PSVersion.Major -ge 3) {
    Read-Host "Pressione ENTER para fechar"
}
