@echo off
chcp 65001 > nul
title Canivete Suíço Dev - Servidor Local
cd /d "%~dp0"

echo.
echo ========================================================
echo   Canivete Suíço Dev
echo   Iniciando servidor local (necessario para RSS / PWA)
echo ========================================================
echo.

where python >nul 2>&1
if %errorlevel%==0 (
    python server.py
    goto :eof
)

where py >nul 2>&1
if %errorlevel%==0 (
    py -3 server.py
    goto :eof
)

echo [ERRO] Python nao encontrado.
echo Instale Python 3 ou abra o projeto com:
echo   npx --yes serve -l 8765
echo.
pause
