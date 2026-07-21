@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: CSP allow fonts.googleapis.com and fonts.gstatic.com + SW v2.1.1"
git push
del "%~f0"