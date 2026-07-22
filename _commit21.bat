@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: SW v2.1.4 force cache refresh for split output blocks"
git push
del "%~f0"