@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: smart conversion detection - auto-suggest based on content type (PFX/cert/key/CSR/JWK), search starts empty, ⭐ suggestions group"
git push
del "%~f0"