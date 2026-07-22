@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: remove garbage text from app.js/css, fix modal hidden attribute with CSS :not([hidden])"
git push
del "%~f0"