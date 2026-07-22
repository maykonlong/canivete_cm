@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: output labels show correct file extensions (.pem for cert, .key for key)"
git push
del "%~f0"