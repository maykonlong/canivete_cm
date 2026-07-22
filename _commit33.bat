@echo off
cd /d "%~dp0"
git add -A
git commit -m "chore: bump SW to v2.2.0 - force cache refresh for smart conversion changes"
git push
del "%~f0"