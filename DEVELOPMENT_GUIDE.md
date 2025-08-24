# 개발 가이드 (Development Guide)

## 🎯 TypeScript 오류 방지 가이드

### 1. 타입 정의 원칙

#### ✅ 올바른 방법
```typescript
// types/index.ts에서 중앙 집중식 타입 관리
export interface User {
  id: string;
  name: string;
  email: string;
}

// 컴포넌트에서 import 사용
import { User } from '../types';
```

#### ❌ 피해야 할 방법
```typescript
// 컴포넌트 내에서 로컬 타입 정의 (충돌 위험)
interface User {
  id: string;
  name: string;
}
```

### 2. Firebase 데이터 처리

#### ✅ 올바른 방법
```typescript
import { formatDate, convertTimestampToDate } from '../utils/dateUtils';

// 날짜 표시
<span>{formatDate(user.createdAt)}</span>

// 날짜 비교
const date = convertTimestampToDate(timestamp);
if (date) {
  // 안전한 날짜 처리
}
```

#### ❌ 피해야 할 방법
```typescript
// 직접 Timestamp 메서드 호출 (타입 오류 위험)
<span>{timestamp.toLocaleDateString()}</span>
```

### 3. Import 관리

#### ✅ 올바른 방법
```typescript
// 필요한 것만 import
import { useState, useEffect } from 'react';
import { formatDate } from '../utils/dateUtils';
import { User } from '../types';
```

#### ❌ 피해야 할 방법
```typescript
// 사용하지 않는 import 포함
import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDate, formatDateTime, toISOString } from '../utils/dateUtils';
```

### 4. 컴포넌트 작성 패턴

#### ✅ 권장 패턴
```typescript
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { formatDate } from '../utils/dateUtils';

interface Props {
  userId: string;
  onUserSelect?: (user: User) => void;
}

const UserComponent: React.FC<Props> = ({ userId, onUserSelect }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 데이터 로딩 로직
  }, [userId]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>사용자를 찾을 수 없습니다.</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>가입일: {formatDate(user.createdAt)}</p>
    </div>
  );
};

export default UserComponent;
```

## 🛠️ 개발 워크플로우

### 1. 새 기능 개발 시

1. **타입 정의 먼저**
   ```typescript
   // types/index.ts에 새로운 인터페이스 추가
   export interface NewFeature {
     id: string;
     name: string;
     // ...
   }
   ```

2. **유틸리티 함수 필요시**
   ```typescript
   // utils/에 새로운 유틸리티 파일 생성
   export const processNewFeature = (data: NewFeature) => {
     // 처리 로직
   };
   ```

3. **컴포넌트 작성**
   ```typescript
   // 타입 import 후 사용
   import { NewFeature } from '../types';
   ```

### 2. 기존 코드 수정 시

1. **타입 충돌 확인**
   - 로컬 인터페이스가 있는지 확인
   - types/index.ts의 정의와 일치하는지 확인

2. **Import 정리**
   - 사용하지 않는 import 제거
   - 필요한 타입만 import

3. **날짜 처리 확인**
   - Timestamp/Date 혼용 시 dateUtils 사용

## 🔧 도구 설정

### 1. VS Code 설정

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

### 2. Pre-commit 훅 설정

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

## 📋 코드 리뷰 체크리스트

### TypeScript 관련
- [ ] 타입 정의가 중복되지 않았는가?
- [ ] any 타입 사용을 최소화했는가?
- [ ] 옵셔널 체이닝을 적절히 사용했는가?
- [ ] 날짜 처리가 dateUtils를 통해 이루어졌는가?

### Import 관련
- [ ] 사용하지 않는 import가 제거되었는가?
- [ ] 타입 import가 올바른 경로에서 이루어졌는가?
- [ ] 상대 경로가 일관되게 사용되었는가?

### 코드 품질
- [ ] 변수명이 명확한가?
- [ ] 함수가 단일 책임을 가지는가?
- [ ] 에러 처리가 적절한가?
- [ ] 주석이 필요한 곳에 추가되었는가?

## 🚀 성능 최적화 팁

### 1. 불필요한 리렌더링 방지
```typescript
// useMemo, useCallback 적절히 사용
const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);
const memoizedCallback = useCallback(() => handleClick(id), [id]);
```

### 2. 조건부 렌더링 최적화
```typescript
// 로딩 상태 먼저 체크
if (loading) return <LoadingSpinner />;
if (!data) return <EmptyState />;

return <MainContent data={data} />;
```

### 3. 에러 바운더리 사용
```typescript
// 컴포넌트 트리에서 에러 처리
<ErrorBoundary fallback={<ErrorComponent />}>
  <UserComponent />
</ErrorBoundary>
```

## 📚 참고 자료

- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [React TypeScript 가이드](https://react-typescript-cheatsheet.netlify.app/)
- [Firebase TypeScript 가이드](https://firebase.google.com/docs/firestore/query-data/get-data#typescript)
