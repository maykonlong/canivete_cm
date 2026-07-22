@echo off
cd /d "%~dp0"
echo === Git Status ===
git status --short
echo.
echo === Git Log ===
git log --oneline -5
echo.
echo === Pushing ===
git push origin main 2>&1
echo.
echo === RESULTADO ===
git log --oneline -3
pause