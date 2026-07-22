@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: fake data com cards individuais, copiar por campo, remover ISPB, CSS fake-row"
git push origin main 2>&1
echo.
echo === PUSH RESULTADO ===
git log --oneline -3
del "%~f0"
pause