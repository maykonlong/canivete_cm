@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: modal uses style.display instead of hidden attr, SW v2.1.5 forces cache refresh"
git push
del "%~f0"