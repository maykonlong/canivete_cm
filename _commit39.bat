@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: sidebar-header matches prototype exactly

- Replaced inline SVG + h2 + buttons with sidebar-logo + sidebar-brand
- Logo uses gradient background (.sidebar-logo CSS class)
- Brand text: 'Canivete Dev' matching prototype
- Removed old themeToggle from sidebar (toggle is in header bar)"
git push
del "%~f0"