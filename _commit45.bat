@echo off
cd /d "%~dp0"
del /q "_redesign.ps1" 2>nul
del /q "_fixjs.ps1" 2>nul
del /q "_addcss.ps1" 2>nul
git add -A
git commit -m "feat: reformular geradores - layout organizado, copiar individual por item, qtd padrao 1"
git push
del "%~f0"