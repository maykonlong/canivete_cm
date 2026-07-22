@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: searchable dropdown for conversion type - type to filter (pem, cer, key, pfx)"
git push
del "%~f0"