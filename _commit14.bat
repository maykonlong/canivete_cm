@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: single smart upload button - auto-detects file type, shows password only when needed"
git push
del "%~f0"