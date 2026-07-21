@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: Certificados SSL tool - info, pair validation, PEM/DER, PFX extraction (SW v2.1.0)"
git push
del "%~f0"