@echo off
cd /d "%~dp0"
del /q "_fix_spi.ps1" 2>nul
git add -A
git commit -m "fix: replace SPI references to Geradores in HTML onclick handlers"
git push
del "%~f0"