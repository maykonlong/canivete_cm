@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: bidirectional suggestions - pem_to_pfx suggested when cert/key detected, chain_concat for certs"
git push
del "%~f0"