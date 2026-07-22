@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: remove duplicate _randChar, update all generators to use _criarItem, add copiarTudo"
git push
del "%~f0"