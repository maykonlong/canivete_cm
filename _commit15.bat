@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: clear button resets password panel + conversion labels with emojis + PFX-only/cert-only extract"
git push
del "%~f0"