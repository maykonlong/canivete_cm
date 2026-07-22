@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: PFX conversion options with PEM/CER/KEY variations (5 new types: pfx_to_pem, pfx_to_cer_key, pfx_to_pem_only, pfx_to_cer_only, pfx_to_key_only)"
git push
del "%~f0"