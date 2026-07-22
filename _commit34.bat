@echo off
cd /d "%~dp0"
git add -A
git commit -m "feat: Design System v3.0 - dark/light theme, theme toggle, legacy CSS aliases, SW 3.0.0

- CSS: Added full Design System tokens (spacing, typography, shadows, transitions)
- CSS: Dark/Light theme system with data-theme attribute and legacy aliases
- HTML: data-theme='dark' on <html>, theme toggle button in sidebar header
- JS: Theme persistence via localStorage (devtools_theme)
- SW: Bumped to v3.0.0 to force cache refresh
- All existing functionality preserved via legacy CSS variable aliases"
git push
del "%~f0"