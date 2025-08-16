@echo off
echo 🚀 ResortBite 배포를 시작합니다...

echo 📦 프로덕션 빌드를 생성합니다...
npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ 빌드 실패! 오류를 확인하세요.
    pause
    exit /b 1
)

echo ✅ 빌드 완료!

echo 🌐 Firebase에 배포합니다...
firebase deploy

if %ERRORLEVEL% NEQ 0 (
    echo ❌ 배포 실패! Firebase 설정을 확인하세요.
    pause
    exit /b 1
)

echo ✅ 배포 완료!
echo 🌍 https://resortbyte.web.app 에서 확인하세요.
pause 