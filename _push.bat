@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: clean generator views HTML, remove duplicates, add alfanumérico support"
git push origin main
echo.
echo === PUSH CONCLUIDO ===
git log --oneline -3
del "%~f0"
pause