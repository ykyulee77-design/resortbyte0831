# 🚨 리조트바이트 빠른 문제 해결 스크립트 (PowerShell)
Write-Host "🚨 리조트바이트 빠른 문제 해결 스크립트" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "1. 모든 Node.js 프로세스 종료 중..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ Node.js 프로세스 종료 완료" -ForegroundColor Green
} else {
    Write-Host "ℹ️ 실행 중인 Node.js 프로세스가 없습니다" -ForegroundColor Blue
}

Write-Host ""
Write-Host "2. 포트 상태 확인 중..." -ForegroundColor Cyan
$port3005 = netstat -an | Select-String "LISTENING" | Select-String ":3005"
$port4000 = netstat -an | Select-String "LISTENING" | Select-String ":4000"

if ($port3005) {
    Write-Host "❌ 포트 3005가 여전히 사용 중입니다" -ForegroundColor Red
} else {
    Write-Host "✅ 포트 3005 사용 가능" -ForegroundColor Green
}

if ($port4000) {
    Write-Host "❌ 포트 4000이 여전히 사용 중입니다" -ForegroundColor Red
} else {
    Write-Host "✅ 포트 4000 사용 가능" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. 서버 시작 중..." -ForegroundColor Cyan
Write-Host "React 개발 서버 시작..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host ""
Write-Host "지오코딩 서버 시작..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:addr" -WindowStyle Normal

Write-Host ""
Write-Host "4. 10초 대기 후 포트 상태 재확인..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "5. 최종 포트 상태 확인..." -ForegroundColor Cyan
$finalPort3005 = netstat -an | Select-String "LISTENING" | Select-String ":3005"
$finalPort4000 = netstat -an | Select-String "LISTENING" | Select-String ":4000"

if ($finalPort3005) {
    Write-Host "✅ React 서버 (포트 3005) 실행 중" -ForegroundColor Green
} else {
    Write-Host "❌ React 서버 (포트 3005) 실행 실패" -ForegroundColor Red
}

if ($finalPort4000) {
    Write-Host "✅ 지오코딩 서버 (포트 4000) 실행 중" -ForegroundColor Green
} else {
    Write-Host "❌ 지오코딩 서버 (포트 4000) 실행 실패" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "🎯 문제 해결 완료!" -ForegroundColor Green
Write-Host "브라우저에서 http://localhost:3005 접속하세요" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Yellow

Read-Host "Press Enter to continue"
