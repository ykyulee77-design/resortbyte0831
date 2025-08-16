#!/bin/bash

echo "🚀 ResortBite 배포를 시작합니다..."

echo "📦 프로덕션 빌드를 생성합니다..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패! 오류를 확인하세요."
    exit 1
fi

echo "✅ 빌드 완료!"

echo "🌐 Firebase에 배포합니다..."
firebase deploy

if [ $? -ne 0 ]; then
    echo "❌ 배포 실패! Firebase 설정을 확인하세요."
    exit 1
fi

echo "✅ 배포 완료!"
echo "🌍 https://resortbyte.web.app 에서 확인하세요." 