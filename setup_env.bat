@echo off
SET "NODE_HOME=%~dp0node_bin\node-v22.12.0-win-x64"
SET "PATH=%NODE_HOME%;%PATH%"
echo Node.js v22.12.0 environment configured.
node -v
npm -v

SET "PROXY=http://B624140:JkhJkhGIT18!@proxycam.corp.iberdrola.com:8080"
call npm config set proxy %PROXY%
call npm config set https-proxy %PROXY%
call npm config set strict-ssl false

SET "HTTP_PROXY=%PROXY%"
SET "HTTPS_PROXY=%PROXY%"
SET "ELECTRON_GET_USE_PROXY=true"

echo NPM Proxy Configured ^& Env Vars Set.
