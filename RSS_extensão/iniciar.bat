@echo off
:: Script de auxílio para a Extensão RSS Banco Central
chcp 65001 > nul
title RSS Feed BCB Extension Tool

echo =========================================================
echo       Ferramenta da Extensão RSS Banco Central do Brasil
echo =========================================================
echo.

:menu
echo Escolha uma das opções abaixo:
echo [1] Validar estrutura da extensão
echo [2] Gerar arquivo .ZIP para empacotamento
echo [3] Instruções de instalação no Chrome/Edge
echo [4] Sair
echo.
set /p opcao="Opção desejada (1-4): "

if "%opcao%"=="1" goto validar
if "%opcao%"=="2" goto compactar
if "%opcao%"=="3" goto instrucoes
if "%opcao%"=="4" goto sair
echo Opção inválida, tente novamente.
echo.
goto menu

:validar
echo.
echo [!] Iniciando validação dos arquivos...
set erro=0

if not exist manifest.json (echo [ERRO] manifest.json ausente! & set erro=1) else (echo [OK] manifest.json presente)
if not exist background.js (echo [ERRO] background.js ausente! & set erro=1) else (echo [OK] background.js presente)
if not exist popup.html (echo [ERRO] popup.html ausente! & set erro=1) else (echo [OK] popup.html presente)
if not exist popup.css (echo [ERRO] popup.css ausente! & set erro=1) else (echo [OK] popup.css presente)
if not exist popup.js (echo [ERRO] popup.js ausente! & set erro=1) else (echo [OK] popup.js presente)
if not exist icons\icon-128.png (echo [ERRO] icons\icon-128.png ausente! & set erro=1) else (echo [OK] icon-128.png presente)

if %erro%==0 (
    echo.
    echo [SUCESSO] Estrutura da extensão está 100%% CORRETA e pronta para uso!
) else (
    echo.
    echo [FALHA] Corrija os arquivos ausentes listados acima.
)
echo.
pause
goto menu

:compactar
echo.
echo [!] Compactando extensão...
pushd "%~dp0"
if exist "RSS_extensao.zip" del /f "RSS_extensao.zip"
powershell -ExecutionPolicy Bypass -Command "Compress-Archive -Path 'manifest.json','background.js','popup.html','popup.css','popup.js','icons' -DestinationPath 'RSS_extensao.zip' -Force"
if exist "RSS_extensao.zip" (
    echo [SUCESSO] Extensão compactada com sucesso em:
    echo    %~dp0RSS_extensao.zip
) else (
    echo [ERRO] Falha ao gerar o arquivo compactado.
)
popd
echo.
pause
goto menu

:instrucoes
echo.
echo =========================================================
echo       Como instalar a extensão no Chrome/Edge:
echo =========================================================
echo 1. Abra o navegador (Chrome ou Edge).
echo 2. Acesse a página de extensões:
echo    - No Chrome: chrome://extensions/
echo    - No Edge: edge://extensions/
echo 3. Ative o \"Modo do desenvolvedor\" (Developer Mode) no canto superior direito.
echo 4. Clicar no botão \"Carregar sem compactação\" (Load unpacked) no canto superior esquerdo.
echo 5. Selecione a pasta:
echo    \"%~dp0\"
echo 6. Pronto! A extensão estará ativa e visível na barra de ferramentas.
echo =========================================================
echo.
pause
goto menu

:sair
echo.
echo Obrigado por utilizar a Extensão RSS Banco Central!
echo.
