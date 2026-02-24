$NodeHome = Join-Path $PSScriptRoot "node_bin\node-v22.12.0-win-x64"
$env:Path = "$NodeHome;$env:Path"
Write-Host "Node.js v22.12.0 environment configured." -ForegroundColor Green
node -v
npm -v

# Configure npm proxy
$proxy = "http://B624140:JkhJkhGIT18!@proxycam.corp.iberdrola.com:8080"
npm config set proxy $proxy
npm config set https-proxy $proxy
npm config set strict-ssl false 

$env:HTTP_PROXY = $proxy
$env:HTTPS_PROXY = $proxy
$env:ELECTRON_GET_USE_PROXY = "true"

Write-Host "NPM Proxy Configured & Env Vars Set." -ForegroundColor Green
