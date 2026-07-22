@echo off
cd /d "%~dp0"
del /q "_check.bat" "_forcepush.bat" "_curlcheck.bat" 2>nul
git add -A
git commit -m "refactor: rewrite all generator views - clean HTML, remove duplicates, proper layout"
git push origin main 2>&1
echo.
echo === Resultado do push ===
git log --oneline -3
del "%~f0"
pause