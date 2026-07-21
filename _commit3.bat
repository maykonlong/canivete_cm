@echo off
cd /d "%~dp0"
del /q tests\_test_csv.mjs 2>nul
del /q tests\_papa_info.txt 2>nul
git add -A
git commit -m "fix: CSV-JSON use PapaParse sync return + SW v2.0.2"
git push
del "%~f0"