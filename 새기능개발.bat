@echo off
chcp 65001 >nul
echo ========================================
echo     New Feature Development Tool
echo ========================================
echo.
echo Current location: resortbyte folder (Development)
echo This folder is for local testing only.
echo.
set /p feature_name="Enter new feature name (e.g., chat-system): "

if "%feature_name%"=="" (
    echo Feature name not entered.
    pause
    exit
)

echo.
echo Creating new feature branch: feature/%feature_name%
git checkout develop
git checkout -b feature/%feature_name%

echo.
echo ========================================
echo     Development Environment Ready!
echo     Branch: feature/%feature_name%
echo     Local Server: http://localhost:3000
echo ========================================
echo.
echo Starting VS Code...
code .

echo.
echo Would you like to start the development server with npm start?
set /p start_server="Start server? (y/n): "

if /i "%start_server%"=="y" (
    echo.
    echo Starting development server...
    npm start
) else (
    echo.
    echo Start development in VS Code.
    echo Run 'npm start' command when ready.
)
