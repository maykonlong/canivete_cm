@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: PIX chaves com opcao alfanumerico para CPF/CNPJ, checkbox dinamico"
git push origin main 2>&1
echo.
echo === DONE ===
git log --oneline -3
del "%~f0"
pause