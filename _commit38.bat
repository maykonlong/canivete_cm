@echo off
cd /d "%~dp0"
git add -A
git commit -m "fix: simplified SW fetch handler to fix message channel errors

- Removed API/offline fallback handlers that caused channel errors
- Only intercepts GET requests for same-origin
- External requests (CDN, fonts) bypass SW entirely
- Network First for critical files, Cache First for libs"
git push
del "%~f0"