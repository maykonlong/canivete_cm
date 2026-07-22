@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: Front-end v3.1 — Grid layout, Header bar, Command Palette, Design System

- CSS: Full Design System rewrite (tokens, dark/light themes, responsive)
- HTML: Grid layout (sidebar + header + main), breadcrumb, security badge
- HTML: Command Palette overlay (Ctrl+K) with all 19 tools
- HTML: Theme toggle in header bar
- JS: switchView() with breadcrumb update, Command Palette filter
- JS: toggleTheme() global with localStorage persistence
- SW: Bumped to v3.1.0 for cache refresh
- All 19 tools preserved, all IDs and classes intact"
git push
del "%~f0"