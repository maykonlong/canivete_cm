@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: cert info button (PFX upload only reads binary, certs read as text; MD5 via forge not WebCrypto)"
git push
del "%~f0"