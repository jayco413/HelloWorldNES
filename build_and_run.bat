@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "C:\CodexWorkspace\Tools\NES Development\scripts\build_and_run.ps1" -ProjectRoot "%~dp0"
exit /b %ERRORLEVEL%
