@echo off
title Sejong InvestBook Dev Server
echo ===================================================
echo   세종 금융경제교육 교사연구회 도서 탐색기 실행
echo ===================================================
echo.
echo [1/2] 브라우저에서 http://localhost:3000 을 엽니다...
start http://localhost:3000
echo [2/2] 로컬 개발 서버를 시작합니다...
echo.
cd /d "%~dp0"
cmd /c npm run dev
pause
