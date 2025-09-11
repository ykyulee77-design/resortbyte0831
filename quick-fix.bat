@echo off
echo ========================================
echo     배포된 프로젝트 긴급 수정 도구
echo ========================================
echo.
echo 현재 main 브랜치에서 작업합니다.
echo 수정 완료 후 Enter를 눌러주세요.
echo.
pause

echo 변경사항을 커밋합니다...
git add .
git commit -m "hotfix: 긴급 수정 %date% %time%"

echo 빌드 중...
npm run build

echo Production에 배포합니다...
firebase deploy --only hosting

echo.
echo ========================================
echo     배포 완료!
echo     URL: https://resortbyte.web.app
echo ========================================
pause
