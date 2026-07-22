@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: Conversions tab smart upload (PFX binary read, auto-select type, auto-show password)"
git push
del "%~f0"