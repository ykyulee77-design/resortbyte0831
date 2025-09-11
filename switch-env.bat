@echo off
echo Firebase 환경 전환 도구
echo.
echo 1. Production (resortbyte)
echo 2. Development (resortbyte-dev)
echo.
set /p choice="환경을 선택하세요 (1 또는 2): "

if "%choice%"=="1" (
    echo Production 환경으로 전환 중...
    firebase use resortbyte
    copy .env.production .env
    echo Production 환경으로 전환 완료!
) else if "%choice%"=="2" (
    echo Development 환경으로 전환 중...
    firebase use resortbyte-dev
    copy env.development .env
    echo Development 환경으로 전환 완료!
) else (
    echo 잘못된 선택입니다.
)
pause
