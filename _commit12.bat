@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: 23 cert conversions (fulltext, JSON, fingerprints, SANs, URLs, JWK, CSR, key gen, self-signed, chain, days)"
git push
del "%~f0"