@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: Dashboard view, sidebar nav-groups, footer + aligned with prototype

- Added Dashboard view with stats-grid (4 cards) + tools-grid (6 popular tool cards)
- Sidebar reorganized with nav-groups: Principal (Dashboard, Historico), Codificacao, Formatters
- Added sidebar-footer with user avatar 'CS' and version info
- Default active view is now Dashboard (not base64_img)
- switchView() handles Dashboard navigation from tool cards
- All tool-card clicks navigate to correct tool views
- CSS already had all component styles (stats-grid, tool-card, nav-group, etc.)"
git push
del "%~f0"