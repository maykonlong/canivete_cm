@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: integrate SPI Tools (CPF, CNPJ, PIX, ISO20022, Fake Data) into sidebar + fix navSearch for nav-group structure"
git push
del "%~f0"