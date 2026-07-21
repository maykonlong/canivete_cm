@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: RSS dark theme default + SW v2.0.1 cache bust"
git push
del "%~f0"