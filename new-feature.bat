@echo off
echo ========================================
echo     새 기능 개발 도구
echo ========================================
echo.
set /p feature_name="새 기능 이름을 입력하세요: "

echo develop 브랜치로 이동...
git checkout develop

echo 새 기능 브랜치 생성: feature/%feature_name%
git checkout -b feature/%feature_name%

echo.
echo ========================================
echo     개발 환경 준비 완료!
echo     브랜치: feature/%feature_name%
echo     로컬 서버: http://localhost:3000
echo ========================================
echo.
echo npm start를 실행하여 개발을 시작하세요.
echo.
pause

echo 개발 서버 시작...
npm start
