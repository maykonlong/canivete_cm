@echo off
cd /d "%~dp0"
del /q "_alfa.ps1" 2>nul
del /q "_alfahtml.ps1" 2>nul
del /q "_alfahtml2.ps1" 2>nul
git add -A
git commit -m "feat: suporte alfanumerico CPF/CNPJ - geradores + validacao + checkbox"
git push
del "%~f0"