@echo off
cd /d "%~dp0"
git add -A
git commit -m "refactor: rename SPI module to 'Geradores' (sidebar label + JS namespace window.Geradores)"
git push
del "%~f0"