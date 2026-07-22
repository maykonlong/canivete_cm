@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: split output blocks for PFX (cert+key in separate labeled panels) + smart download extensions (.pem/.key/.json/.cer)"
git push
del "%~f0"