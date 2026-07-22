@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: Info tab reads PFX directly with password field + auto-detect PFX + binary upload"
git push
del "%~f0"