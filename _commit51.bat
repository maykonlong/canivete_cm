@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: fake data PF com seletor de genero (M/F/Aleatorio)"
git push origin main 2>&1
echo.
echo === DONE ===
git log --oneline -3
del "%~f0"
pause