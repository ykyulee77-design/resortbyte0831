@echo off
echo 개발 서버 시작 중...
echo.
echo 1. React 개발 서버 (포트 3000)
echo 2. Firebase 에뮬레이터 (포트 5000)
echo 3. 둘 다 시작
echo.
set /p choice="선택하세요 (1, 2, 또는 3): "

if "%choice%"=="1" (
    echo React 개발 서버 시작...
    npm start
) else if "%choice%"=="2" (
    echo Firebase 에뮬레이터 시작...
    firebase emulators:start
) else if "%choice%"=="3" (
    echo React 개발 서버와 Firebase 에뮬레이터 시작...
    start "React Dev Server" cmd /k "npm start"
    timeout /t 3
    firebase emulators:start
) else (
    echo 잘못된 선택입니다.
)
pause
