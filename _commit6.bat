@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: cert conversions dropdown (8 types) + PFX extract selector (5 options)"
git push
del "%~f0"