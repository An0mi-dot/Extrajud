@echo off
set "NODE_BIN=%~dp0"
"%NODE_BIN%node.exe" "%NODE_BIN%node_modules\npm\bin\npm-cli.js" %*
