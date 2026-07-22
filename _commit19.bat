@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: comprehensive tooltips on ALL buttons, nav-items, selects, textareas, passwords across entire project"
git push
del "%~f0"