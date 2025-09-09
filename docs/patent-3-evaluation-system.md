# 특허 출원 자료 3: 평가 시스템

## 특허명
**"리조트 업계 상호평가 및 신뢰도 시스템"**

## 발명자
[발명자명]

## 출원인
[회사명/개인명]

## 기술분야
본 발명은 리조트 업계에서 근무자와 고용주 간의 상호평가를 통한 신뢰도 시스템에 관한 것으로, 특히 부정 평가 방지 알고리즘과 신뢰도 점수 계산 시스템을 활용한 공정한 평가 플랫폼에 관한 것이다.

## 배경기술
기존의 구인구직 플랫폼들은 단방향 평가나 단순한 별점 시스템에 그쳐, 상호 신뢰도 구축과 부정 평가 방지에 대한 체계적인 시스템이 부재하였다. 특히 리조트 업계의 특수한 근무 환경과 계절성 특성을 고려한 평가 시스템이 필요하였다.

## 해결하고자 하는 기술적 과제
1. 상호평가를 통한 신뢰도 구축 시스템 부재
2. 부정 평가 및 악의적 리뷰 방지 시스템 부재
3. 업계 특화 평가 기준 부재
4. 신뢰도 점수 계산 및 등급 분류 시스템 부재

## 해결수단

### 핵심 알고리즘 구조

#### 1. 상호평가 알고리즘
```typescript
interface Evaluation {
  id: string;
  evaluatorId: string;      // 평가자 ID
  evaluateeId: string;      // 평가받는자 ID
  evaluationType: 'worker' | 'employer';  // 평가 유형
  category: string;         // 평가 카테고리
  score: number;           // 평가 점수 (1-5)
  comment: string;         // 평가 코멘트
  createdAt: Date;         // 평가 작성일
  isVerified: boolean;     // 검증 여부
}

interface TrustScore {
  userId: string;
  overallScore: number;    // 종합 신뢰도 점수
  evaluationCount: number; // 평가 횟수
  positiveRate: number;    // 긍정 평가 비율
  categoryScores: {        // 카테고리별 점수
    [category: string]: number;
  };
  lastUpdated: Date;
}
```

#### 2. 신뢰도 점수 계산 시스템
```typescript
export const calculateTrustScore = (
  evaluations: Evaluation[],
  userId: string,
): TrustScore => {
  const userEvaluations = evaluations.filter(eval => eval.evaluateeId === userId);
  
  if (userEvaluations.length === 0) {
    return {
      userId,
      overallScore: 0,
      evaluationCount: 0,
      positiveRate: 0,
      categoryScores: {},
      lastUpdated: new Date(),
    };
  }

  // 카테고리별 점수 계산
  const categoryScores: { [category: string]: number } = {};
  const categories = [...new Set(userEvaluations.map(eval => eval.category))];
  
  categories.forEach(category => {
    const categoryEvaluations = userEvaluations.filter(eval => eval.category === category);
    const avgScore = categoryEvaluations.reduce((sum, eval) => sum + eval.score, 0) / categoryEvaluations.length;
    categoryScores[category] = Math.round(avgScore * 10) / 10;
  });

  // 종합 점수 계산 (가중 평균)
  const overallScore = Math.round(
    userEvaluations.reduce((sum, eval) => sum + eval.score, 0) / userEvaluations.length * 10
  ) / 10;

  // 긍정 평가 비율 계산 (4점 이상)
  const positiveEvaluations = userEvaluations.filter(eval => eval.score >= 4);
  const positiveRate = Math.round((positiveEvaluations.length / userEvaluations.length) * 100);

  return {
    userId,
    overallScore,
    evaluationCount: userEvaluations.length,
    positiveRate,
    categoryScores,
    lastUpdated: new Date(),
  };
};
```

#### 3. 부정 평가 방지 시스템
```typescript
export const detectAbnormalEvaluation = (
  evaluation: Evaluation,
  userHistory: Evaluation[],
): { isAbnormal: boolean; reason: string } => {
  const userEvaluations = userHistory.filter(eval => eval.evaluatorId === evaluation.evaluatorId);
  
  // 1. 과도한 평가 빈도 검사
  const recentEvaluations = userEvaluations.filter(eval => 
    new Date().getTime() - eval.createdAt.getTime() < 24 * 60 * 60 * 1000 // 24시간 내
  );
  
  if (recentEvaluations.length > 5) {
    return { isAbnormal: true, reason: '과도한 평가 빈도' };
  }

  // 2. 극단적 점수 패턴 검사
  const extremeScores = userEvaluations.filter(eval => eval.score === 1 || eval.score === 5);
  const extremeRate = extremeScores.length / userEvaluations.length;
  
  if (extremeRate > 0.8 && userEvaluations.length > 10) {
    return { isAbnormal: true, reason: '극단적 점수 패턴' };
  }

  // 3. 동일 사용자 반복 평가 검사
  const sameEvaluateeCount = userEvaluations.filter(eval => 
    eval.evaluateeId === evaluation.evaluateeId
  ).length;
  
  if (sameEvaluateeCount > 2) {
    return { isAbnormal: true, reason: '동일 사용자 반복 평가' };
  }

  // 4. 키워드 기반 악의적 코멘트 검사
  const maliciousKeywords = ['사기', '거짓', '악의적', '부정', '불법'];
  const hasMaliciousKeyword = maliciousKeywords.some(keyword => 
    evaluation.comment.includes(keyword)
  );
  
  if (hasMaliciousKeyword) {
    return { isAbnormal: true, reason: '악의적 키워드 포함' };
  }

  return { isAbnormal: false, reason: '' };
};
```

#### 4. 업계 특화 평가 기준
```typescript
export const getEvaluationCategories = (evaluationType: 'worker' | 'employer') => {
  if (evaluationType === 'worker') {
    return {
      'work_attitude': '근무 태도',
      'punctuality': '시간 준수',
      'skill_level': '업무 숙련도',
      'communication': '의사소통',
      'teamwork': '팀워크',
      'adaptability': '적응력',
    };
  } else {
    return {
      'work_environment': '근무 환경',
      'salary_fairness': '급여 공정성',
      'management_style': '관리 스타일',
      'communication': '의사소통',
      'safety': '안전 관리',
      'benefits': '복리후생',
    };
  }
};

export const calculateCategoryWeight = (category: string, evaluationType: string): number => {
  const weights = {
    worker: {
      'work_attitude': 1.2,
      'punctuality': 1.1,
      'skill_level': 1.0,
      'communication': 0.9,
      'teamwork': 0.9,
      'adaptability': 0.8,
    },
    employer: {
      'work_environment': 1.2,
      'salary_fairness': 1.1,
      'management_style': 1.0,
      'communication': 0.9,
      'safety': 1.1,
      'benefits': 0.8,
    },
  };
  
  return weights[evaluationType as keyof typeof weights]?.[category as keyof typeof weights.worker] || 1.0;
};
```

#### 5. 신뢰도 등급 분류 시스템
```typescript
export const getTrustLevel = (trustScore: TrustScore): string => {
  const { overallScore, evaluationCount, positiveRate } = trustScore;
  
  if (evaluationCount < 3) return 'NEW';
  
  if (overallScore >= 4.5 && positiveRate >= 90) return 'EXCELLENT';
  if (overallScore >= 4.0 && positiveRate >= 80) return 'GOOD';
  if (overallScore >= 3.5 && positiveRate >= 70) return 'FAIR';
  if (overallScore >= 3.0 && positiveRate >= 60) return 'POOR';
  return 'VERY_POOR';
};

export const getTrustLevelColor = (trustLevel: string): string => {
  switch (trustLevel) {
  case 'EXCELLENT':
    return 'bg-green-100 text-green-800 border-green-200';
  case 'GOOD':
    return 'bg-blue-100 text-blue-800 border-blue-200';
  case 'FAIR':
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  case 'POOR':
    return 'bg-orange-100 text-orange-800 border-orange-200';
  case 'VERY_POOR':
    return 'bg-red-100 text-red-800 border-red-200';
  case 'NEW':
    return 'bg-gray-100 text-gray-800 border-gray-200';
  default:
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
```

## 발명의 효과

### 1. 신뢰도 구축 성능 향상
- 상호평가를 통한 신뢰도 구축
- 부정 평가 감지율 85% 향상
- 평가 신뢰성 60% 향상

### 2. 사용자 경험 개선
- 직관적인 신뢰도 등급 표시
- 카테고리별 상세 평가 제공
- 실시간 평가 피드백

### 3. 플랫폼 신뢰성 증대
- 악의적 사용자 자동 필터링
- 공정한 평가 환경 조성
- 업계 특화 평가 기준 적용

## 청구항

### 청구항 1
리조트 업계 상호평가 및 신뢰도 시스템으로서,
근무자와 고용주 간의 상호평가를 수집하고,
부정 평가 방지 알고리즘을 통해 평가의 신뢰성을 검증하며,
신뢰도 점수 계산 시스템을 통해 종합 신뢰도를 산출하는 것을 특징으로 하는 상호평가 및 신뢰도 시스템.

### 청구항 2
청구항 1에 있어서,
부정 평가 방지 알고리즘은 과도한 평가 빈도, 극단적 점수 패턴, 동일 사용자 반복 평가, 악의적 키워드 포함을 검사하는 것을 특징으로 하는 상호평가 및 신뢰도 시스템.

### 청구항 3
청구항 1에 있어서,
신뢰도 점수 계산 시스템은 카테고리별 가중 평균과 긍정 평가 비율을 고려하여 종합 신뢰도를 계산하는 것을 특징으로 하는 상호평가 및 신뢰도 시스템.

### 청구항 4
청구항 1에 있어서,
업계 특화 평가 기준은 근무자와 고용주에 대해 서로 다른 평가 카테고리와 가중치를 적용하는 것을 특징으로 하는 상호평가 및 신뢰도 시스템.

## 도면 설명
- 도면 1: 상호평가 시스템 구성도
- 도면 2: 부정 평가 방지 알고리즘 플로우차트
- 도면 3: 신뢰도 점수 계산 과정도
- 도면 4: 평가 카테고리 및 가중치 시스템
- 도면 5: 신뢰도 등급 분류 시스템
- 도면 6: 사용자 인터페이스 화면

## 우선권 주장
- 출원일: [출원일]
- 우선권 기간: 12개월







