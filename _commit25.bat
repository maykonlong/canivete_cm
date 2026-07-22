@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: PFX extraction labels show .cer and .key extensions with correct download data-ext"
git push
del "%~f0"