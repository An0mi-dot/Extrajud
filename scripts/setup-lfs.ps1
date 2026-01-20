# PowerShell helper to initialize Git LFS and track zip files
# Run this in repository root on Windows PowerShell (requires admin if installing)

Write-Host "Initializing Git LFS..."
git lfs install

Write-Host "Tracking *.zip with Git LFS and adding .gitattributes"
git lfs track "*.zip"
if (Test-Path .gitattributes) { git add .gitattributes }

Write-Host "If you have a large zip to add (e.g., scripts.zip), run: git add scripts.zip; git commit -m 'Add large zip via LFS'; git push"

Write-Host "Done. Note: ensure Git LFS is installed on CI/other machines as well."