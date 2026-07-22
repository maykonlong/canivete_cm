@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: auto-add tooltips to all toolbar buttons (Upload, Baixar, Copiar, Limpar)"
git push
del "%~f0"