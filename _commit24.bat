@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: error modal popup for wrong PFX password (requires OK to dismiss)"
git push
del "%~f0"