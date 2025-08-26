@echo off
echo 🚀 ResortByte 서버들을 개선된 방식으로 시작합니다...
echo.

REM 기존 Node.js 프로세스 종료
echo 🔄 기존 프로세스를 정리합니다...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

REM 의존성 설치 확인
echo 📦 의존성을 확인합니다...
if not exist "node_modules" (
    echo 설치 중...
    npm install
)

REM 환경 변수 설정 및 서버들 동시 시작
echo 🎯 서버들을 시작합니다...
echo 📡 API URL: http://localhost:4000 (동적 포트 할당)
echo 🌐 프론트엔드: http://localhost:3000
echo.

REM 환경 변수 설정 후 서버 시작
set REACT_APP_API_URL=http://localhost:4000
set REACT_APP_ENV=development

start "Backend Server" cmd /k "npm run server"
timeout /t 3 >nul
start "Frontend Server" cmd /k "npm start"

echo.
echo ✅ 서버들이 시작되었습니다!
echo 📱 프론트엔드: http://localhost:3000
echo 🔧 백엔드: http://localhost:4000 (또는 다른 사용 가능한 포트)
echo.
echo 🎯 개선사항:
echo   - 포트 충돌 자동 해결
echo   - undefined 값 처리 개선
echo   - 환경 변수 설정
echo   - 더 빠른 시작 시간
echo.
echo 종료하려면 각 창을 닫거나 Ctrl+C를 누르세요.
pause
