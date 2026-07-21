@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: v2.0.0 - ESLint CI testes auditoria seguranca logs estruturados"
git push
del "%~f0"