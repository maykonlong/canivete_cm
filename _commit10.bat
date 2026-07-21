@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: all crypto via forge (no WebCrypto), SW v2.1.2 with no-cache install"
git push
del "%~f0"