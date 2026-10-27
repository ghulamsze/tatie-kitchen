@echo off
title Tatie Kitchen - Kasir
cd /d "c:\Users\lenovo\OneDrive\Documents\00 - Arsip Akademik\D - Coding\01 - Rekayasa Perangkat Lunak"

echo ========================================================
echo   TATIE KITCHEN - SISTEM KASIR TABLET
echo ========================================================
echo Memeriksa server lokal...

powershell -Command "if (!(Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue)) { exit 1 } else { exit 0 }"
if %ERRORLEVEL% NEQ 0 (
    echo Server belum aktif. Memulai server Vite...
    start /min "Tatie Kitchen Server" cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
)

echo Membuka aplikasi kasir di browser...
start http://localhost:5173
exit
