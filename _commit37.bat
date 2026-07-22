@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: SW uses Network First for sw.js to enable auto-update

- sw.js fetched from network first (prevents stale SW from blocking updates)
- index.html and css/style.css also fetched from network first
- Fixes GitHub Pages not reflecting changes due to aggressive caching"
git push
del "%~f0"