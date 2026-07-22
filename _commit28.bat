@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: PFX conversion options show .cer and .key extensions in select labels"
git push
del "%~f0"