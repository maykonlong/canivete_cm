@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: only PFX uses binary upload; cert/key use generic text upload"
git push
del "%~f0"