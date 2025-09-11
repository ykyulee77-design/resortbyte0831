@echo off
chcp 65001 >nul
echo ========================================
echo    ResortByte 특허 출원 자료 PDF 변환
echo ========================================
echo.

REM 출력 폴더 생성
if not exist "특허출원자료" (
    echo 📁 특허출원자료 폴더를 생성합니다...
    mkdir "특허출원자료"
)

echo.
echo 🔄 PDF 변환을 시작합니다...
echo.

REM 1. 스마트 매칭 알고리즘
if exist "docs\patent-1-smart-matching.md" (
    echo 📄 1. 스마트 매칭 알고리즘 변환 중...
    pandoc "docs\patent-1-smart-matching.md" -o "특허출원자료\1. 스마트매칭알고리즘.pdf" --pdf-engine=wkhtmltopdf --css=style.css
    echo ✅ 완료: 1. 스마트매칭알고리즘.pdf
) else (
    echo ❌ 파일 없음: docs\patent-1-smart-matching.md
)

REM 2. 스케줄 매칭 시스템
if exist "docs\patent-2-schedule-matching.md" (
    echo 📄 2. 스케줄 매칭 시스템 변환 중...
    pandoc "docs\patent-2-schedule-matching.md" -o "특허출원자료\2. 스케줄매칭시스템.pdf" --pdf-engine=wkhtmltopdf --css=style.css
    echo ✅ 완료: 2. 스케줄매칭시스템.pdf
) else (
    echo ❌ 파일 없음: docs\patent-2-schedule-matching.md
)

REM 3. 평가 시스템
if exist "docs\patent-3-evaluation-system.md" (
    echo 📄 3. 평가 시스템 변환 중...
    pandoc "docs\patent-3-evaluation-system.md" -o "특허출원자료\3. 평가시스템.pdf" --pdf-engine=wkhtmltopdf --css=style.css
    echo ✅ 완료: 3. 평가시스템.pdf
) else (
    echo ❌ 파일 없음: docs\patent-3-evaluation-system.md
)

REM 4. 기숙사 추천 시스템
if exist "docs\patent-4-accommodation-recommendation.md" (
    echo 📄 4. 기숙사 추천 시스템 변환 중...
    pandoc "docs\patent-4-accommodation-recommendation.md" -o "특허출원자료\4. 기숙사추천시스템.pdf" --pdf-engine=wkhtmltopdf --css=style.css
    echo ✅ 완료: 4. 기숙사추천시스템.pdf
) else (
    echo ❌ 파일 없음: docs\patent-4-accommodation-recommendation.md
)

REM 5. 종합 요약서
if exist "docs\patent-summary.md" (
    echo 📄 5. 종합 요약서 변환 중...
    pandoc "docs\patent-summary.md" -o "특허출원자료\5. 종합요약서.pdf" --pdf-engine=wkhtmltopdf --css=style.css
    echo ✅ 완료: 5. 종합요약서.pdf
) else (
    echo ❌ 파일 없음: docs\patent-summary.md
)

echo.
echo ========================================
echo 🎉 모든 PDF 변환이 완료되었습니다!
echo ========================================
echo.
echo 📁 생성된 파일들:
dir "특허출원자료\*.pdf" /b
echo.
echo 💡 다음 단계:
echo    1. 생성된 PDF 파일들을 확인하세요
echo    2. 변리사와 상담하여 최종 검토를 받으세요
echo    3. 특허청에 출원하세요
echo.
pause









