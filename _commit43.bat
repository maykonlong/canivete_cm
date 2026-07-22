@echo off
cd /d "%~dp0"
del /q "_hide_iso.ps1" 2>nul
git add -A
git commit -m "chore: hide ISO 20022 section from sidebar (hidden until ready)"
git push
del "%~f0"