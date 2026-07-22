@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: clear error message for wrong PFX password (detects password/MAC/invalid errors)"
git push
del "%~f0"