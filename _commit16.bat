@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: security badge with tooltip (hover desktop / tap mobile) + CSS"
git push
del "%~f0"