@echo off
echo 🚨 리조트바이트 빠른 문제 해결 스크립트
echo ================================================

echo.
echo 1. 모든 Node.js 프로세스 종료 중...
taskkill /f /im node.exe 2>nul
if %errorlevel% == 0 (
    echo ✅ Node.js 프로세스 종료 완료
) else (
    echo ℹ️ 실행 중인 Node.js 프로세스가 없습니다
)

echo.
echo 2. 포트 상태 확인 중...
netstat -an | findstr "LISTENING" | findstr ":3005"
if %errorlevel% == 0 (
    echo ❌ 포트 3005가 여전히 사용 중입니다
) else (
    echo ✅ 포트 3005 사용 가능
)

netstat -an | findstr "LISTENING" | findstr ":4000"
if %errorlevel% == 0 (
    echo ❌ 포트 4000이 여전히 사용 중입니다
) else (
    echo ✅ 포트 4000 사용 가능
)

echo.
echo 3. 서버 시작 중...
echo React 개발 서버 시작...
start "React Server" cmd /k "npm start"

echo.
echo 4. 지오코딩 서버 시작...
start "Geocoding Server" cmd /k "npm run start:addr"

echo.
echo 5. 10초 대기 후 포트 상태 재확인...
timeout /t 10 /nobreak >nul

echo.
echo 6. 최종 포트 상태 확인...
netstat -an | findstr "LISTENING" | findstr ":3005"
if %errorlevel% == 0 (
    echo ✅ React 서버 (포트 3005) 실행 중
) else (
    echo ❌ React 서버 (포트 3005) 실행 실패
)

netstat -an | findstr "LISTENING" | findstr ":4000"
if %errorlevel% == 0 (
    echo ✅ 지오코딩 서버 (포트 4000) 실행 중
) else (
    echo ❌ 지오코딩 서버 (포트 4000) 실행 실패
)

echo.
echo ================================================
echo 🎯 문제 해결 완료!
echo 브라우저에서 http://localhost:3005 접속하세요
echo ================================================
pause