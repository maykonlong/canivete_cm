@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: cert tool - upload/download/copy toolbars on all tabs"
git push
del "%~f0"