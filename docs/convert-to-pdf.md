# 특허 출원 자료 PDF 변환 가이드

## 🖨️ PDF 변환 방법

### **방법 1: 브라우저 인쇄 기능 사용**
1. **Chrome/Edge에서 열기**
   - `docs/patent-1-smart-matching.md` 파일을 브라우저에서 열기
   - `Ctrl + P` (인쇄 단축키)
   - 대상: "PDF로 저장" 선택
   - 페이지 설정: A4, 여백 최소화
   - 저장

### **방법 2: VS Code 확장 프로그램**
1. **Markdown PDF 확장 설치**
   - VS Code에서 `Ctrl + Shift + X`
   - "Markdown PDF" 검색 후 설치
2. **PDF 생성**
   - `.md` 파일에서 `Ctrl + Shift + P`
   - "Markdown PDF: Export (pdf)" 선택

### **방법 3: 온라인 변환 도구**
1. **Pandoc 사용**
   ```bash
   pandoc patent-1-smart-matching.md -o patent-1-smart-matching.pdf
   ```

2. **온라인 변환기**
   - https://www.markdowntopdf.com/
   - https://md-to-pdf.fly.dev/

## 📄 문서 포맷팅

### **A4 용지 설정**
- 용지 크기: A4 (210mm × 297mm)
- 여백: 상하좌우 20mm
- 글꼴: 나눔고딕 또는 맑은 고딕
- 글자 크기: 본문 11pt, 제목 14pt

### **페이지 번호**
- 하단 중앙에 페이지 번호 추가
- 표지 제외하고 2페이지부터 시작

### **목차 자동 생성**
- 각 섹션에 헤딩 번호 부여
- 자동 목차 생성

## 📁 파일 구조

```
특허출원자료/
├── 1. 스마트매칭알고리즘.pdf
├── 2. 스케줄매칭시스템.pdf
├── 3. 평가시스템.pdf
├── 4. 기숙사추천시스템.pdf
├── 5. 종합요약서.pdf
└── 첨부자료/
    ├── 소스코드/
    ├── 도면/
    └── 참고문헌/
```

## 🎯 특허청 제출용 포맷

### **필수 요소**
1. **표지**
   - 특허명
   - 발명자 정보
   - 출원인 정보
   - 출원일

2. **명세서**
   - 기술분야
   - 배경기술
   - 해결하고자 하는 기술적 과제
   - 해결수단
   - 발명의 효과
   - 청구항

3. **도면**
   - 시스템 구성도
   - 알고리즘 플로우차트
   - 사용자 인터페이스

4. **요약서**
   - 발명의 요지
   - 주요 청구항

## 💻 자동화 스크립트

### **Windows 배치 파일**
```batch
@echo off
echo 특허 출원 자료 PDF 변환 시작...

REM Markdown 파일들을 PDF로 변환
pandoc docs/patent-1-smart-matching.md -o "특허출원자료/1. 스마트매칭알고리즘.pdf"
pandoc docs/patent-2-schedule-matching.md -o "특허출원자료/2. 스케줄매칭시스템.pdf"
pandoc docs/patent-3-evaluation-system.md -o "특허출원자료/3. 평가시스템.pdf"
pandoc docs/patent-4-accommodation-recommendation.md -o "특허출원자료/4. 기숙사추천시스템.pdf"
pandoc docs/patent-summary.md -o "특허출원자료/5. 종합요약서.pdf"

echo PDF 변환 완료!
pause
```

### **PowerShell 스크립트**
```powershell
# 특허 출원 자료 PDF 변환
$docsPath = "docs"
$outputPath = "특허출원자료"

# 출력 폴더 생성
if (!(Test-Path $outputPath)) {
    New-Item -ItemType Directory -Path $outputPath
}

# Markdown 파일들을 PDF로 변환
$files = @(
    "patent-1-smart-matching.md",
    "patent-2-schedule-matching.md", 
    "patent-3-evaluation-system.md",
    "patent-4-accommodation-recommendation.md",
    "patent-summary.md"
)

$names = @(
    "1. 스마트매칭알고리즘.pdf",
    "2. 스케줄매칭시스템.pdf",
    "3. 평가시스템.pdf", 
    "4. 기숙사추천시스템.pdf",
    "5. 종합요약서.pdf"
)

for ($i = 0; $i -lt $files.Length; $i++) {
    $inputFile = Join-Path $docsPath $files[$i]
    $outputFile = Join-Path $outputPath $names[$i]
    
    if (Test-Path $inputFile) {
        pandoc $inputFile -o $outputFile
        Write-Host "변환 완료: $($names[$i])"
    } else {
        Write-Host "파일 없음: $inputFile"
    }
}

Write-Host "모든 PDF 변환 완료!"
```

## 📋 체크리스트

### **변환 전 확인사항**
- [ ] 모든 Markdown 파일이 완성되었는지 확인
- [ ] 이미지 및 링크가 올바른지 확인
- [ ] 특수문자 및 수식이 제대로 표시되는지 확인

### **변환 후 확인사항**
- [ ] PDF 파일이 정상적으로 생성되었는지 확인
- [ ] 페이지 레이아웃이 올바른지 확인
- [ ] 글꼴이 제대로 표시되는지 확인
- [ ] 목차가 자동 생성되었는지 확인

### **제출 전 최종 확인**
- [ ] 모든 파일이 포함되었는지 확인
- [ ] 파일명이 올바른지 확인
- [ ] 용량이 적절한지 확인 (10MB 이하 권장)

## 🎯 권장사항

1. **고품질 PDF 생성**
   - 고해상도 설정 사용
   - 벡터 이미지 사용
   - 압축 최소화

2. **파일 관리**
   - 버전 관리 시스템 사용
   - 백업 파일 생성
   - 메타데이터 추가

3. **보안**
   - PDF 암호화 고려
   - 워터마크 추가
   - 저작권 표시

---

**이 가이드를 따라 특허 출원 자료를 전문적인 PDF 문서로 변환하세요!** 📄✨







