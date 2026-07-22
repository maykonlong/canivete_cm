@echo off
cd /d "%~dp0"
git add -A
git status --short
echo.
git commit -m "feat: fake data cards com copiar individual, remover ISPB, alfanumerico CPF/CNPJ"
echo.
git push origin main
echo.
echo === DONE ===
git log --oneline -3
del "%~f0"
pause