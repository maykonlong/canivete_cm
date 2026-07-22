@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: remove duplicate Texto para QR Code nav-item, simplified SW fetch handler"
git push
del "%~f0"