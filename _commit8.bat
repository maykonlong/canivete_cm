@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: PFX/cert upload reads as base64 (not text) via dedicated binary FileReader"
git push
del "%~f0"