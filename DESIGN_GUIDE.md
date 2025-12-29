# Home-Cash 디자인 가이드

> 일관성 있는 UI/UX를 위한 디자인 시스템 가이드

## 📋 목차

- [컬러 시스템](#컬러-시스템)
- [타이포그래피](#타이포그래피)
- [레이아웃](#레이아웃)
- [컴포넌트](#컴포넌트)
- [다크모드](#다크모드)
- [접근성](#접근성)

---

## 🎨 컬러 시스템

### CSS 변수 사용 원칙

**✅ DO: CSS 변수 사용**
```tsx
// Good: CSS 변수 사용
<div className="bg-primary text-primary-foreground" />
<circle stroke="hsl(var(--status-success))" />
```

**❌ DON'T: 하드코딩된 컬러 값**
```tsx
// Bad: 하드코딩 금지
<div style={{ color: '#ef4444' }} />
<circle stroke="#22c55e" />
```

### 시맨틱 컬러

재무 앱의 특성에 맞는 시맨틱 컬러를 사용합니다.

#### Financial Colors
```css
/* Light Mode */
--income: 142 76% 36%;      /* 수입: 초록 */
--expense: 0 84% 60%;        /* 지출: 빨강 */
--transfer: 217 91% 60%;     /* 이체: 파랑 */
```

#### Status Colors
```css
/* Light Mode */
--status-success: 142 76% 36%;  /* 성공: 초록 */
--status-warning: 38 92% 50%;   /* 경고: 주황 */
--status-danger: 0 84% 60%;     /* 위험: 빨강 */
--status-info: 217 91% 60%;     /* 정보: 파랑 */

/* Dark Mode */
--status-success: 142 70% 45%;
--status-warning: 38 90% 60%;
--status-danger: 0 84% 70%;
--status-info: 217 91% 70%;
```

### Tailwind 클래스 활용

```tsx
// Financial colors
<span className="amount-income">+{formatCurrency(amount)}</span>
<span className="amount-expense">-{formatCurrency(amount)}</span>
<span className="amount-transfer">{formatCurrency(amount)}</span>
```

---

## 📝 타이포그래피

### 폰트 패밀리

```css
/* 본문 */
font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;

/* 제목 (h1-h6) */
font-family: 'Outfit', 'IBM Plex Sans', sans-serif;
```

### 타이포그래피 스케일

| 용도 | 클래스 | 예시 |
|------|--------|------|
| 페이지 제목 | `text-2xl font-bold` | 예산 관리, 통계, 대시보드 |
| 카드 제목 (대) | `text-lg font-semibold` | 총 예산 현황, 카테고리별 예산 |
| 카드 제목 (소) | `text-sm font-semibold` | KPI 카드 제목 |
| 본문 | `text-base` | 일반 텍스트 |
| 보조 텍스트 | `text-sm text-muted-foreground` | 설명, 도움말 |
| 캡션 | `text-xs text-muted-foreground` | 거래 건수, 날짜 등 |

### 금액 표시

금액은 항상 **tabular-nums**를 사용하여 정렬을 일관되게 유지합니다.

```tsx
// Good: tabular-nums 사용
<div className="text-2xl font-bold tabular-nums">
  {formatCurrency(amount)}
</div>

// Bad: 일반 숫자
<div className="text-2xl font-bold">
  {formatCurrency(amount)}
</div>
```

### 제목 스타일

제목은 Outfit 폰트를 사용하며, 자동으로 letter-spacing이 조정됩니다.

```css
h1, h2, h3, h4, h5, h6 {
  font-family: 'Outfit', 'IBM Plex Sans', sans-serif;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

---

## 📐 레이아웃

### 표준 그리드 패턴

`/src/lib/constants/layouts.ts`에 정의된 상수를 사용합니다.

```tsx
import { LAYOUTS } from '@/lib/constants/layouts';

// 2열 그리드
<div className={LAYOUTS.twoColumn}>
  {/* content */}
</div>

// 3열 그리드
<div className={LAYOUTS.threeColumn}>
  {/* content */}
</div>

// 대시보드 그리드 (12열 기반)
<div className={LAYOUTS.dashboard}>
  {/* content */}
</div>
```

### 간격 (Spacing)

```tsx
import { SPACING } from '@/lib/constants/layouts';

// 섹션 간 수직 간격
<div className={SPACING.section}>
  {/* sections */}
</div>

// 카드 그리드 간격
<div className={SPACING.cardGap}>
  {/* cards */}
</div>
```

### 표준 간격 값

| 용도 | 값 | 클래스 |
|------|-----|--------|
| 섹션 간격 | 1.5rem (24px) | `space-y-6` |
| 카드 간격 | 1.5rem (24px) | `gap-6` |
| 작은 간격 | 1rem (16px) | `gap-4` |

### 컴포넌트 크기

```tsx
import { SIZES } from '@/lib/constants/layouts';

// 월 네비게이터
<span className={SIZES.monthNavigator}>
  {format(currentMonth, 'yyyy년 M월')}
</span>

// 터치 타겟 (모바일 접근성)
<button className={SIZES.touchTarget}>
  {/* content */}
</button>
```

### 반응형 브레이크포인트

```tsx
// 모바일 퍼스트 접근
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/*
    모바일: 1열
    태블릿 (md: 768px+): 2열
    데스크톱 (lg: 1024px+): 3열
  */}
</div>
```

---

## 🧩 컴포넌트

### PageHeader

페이지 최상단 헤더를 표준화합니다.

```tsx
import { PageHeader } from '@/components/common/PageHeader';

<PageHeader
  title="페이지 제목"
  description="선택적 설명" // optional
  action={<Button>액션</Button>} // optional
/>
```

**사용 위치:**
- BudgetPage
- StatisticsPage
- 모든 메인 페이지

### EmptyState

데이터가 없을 때 표시하는 빈 상태 UI입니다.

```tsx
import { EmptyState } from '@/components/common/EmptyState';
import { CreditCard } from 'lucide-react';

<EmptyState
  icon={<CreditCard className="h-12 w-12" />} // optional
  title="등록된 카드가 없습니다"
  description="카드를 추가하여 실적과 혜택을 관리하세요" // optional
  action={<Button>카드 추가</Button>} // optional
/>
```

**사용 위치:**
- CherryPickerPage
- CardsPage
- 리스트가 비어있는 모든 페이지

### KpiCard

재무 지표를 표시하는 카드입니다.

```tsx
import { KpiCard } from '@/components/common/KpiCard';

<KpiCard
  title="월 수입"
  amount={1500000}
  changeRate={12.5} // optional
  variant="income" // 'income' | 'expense' | 'net'
/>
```

### Card 컴포넌트

shadcn/ui의 Card 컴포넌트를 일관되게 사용합니다.

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    {/* 내용 */}
  </CardContent>
</Card>
```

**패딩 표준:**
- 일반 카드: `p-6`
- 컴팩트 카드: `p-3`
- 빈 상태: `p-12`

---

## 🌓 다크모드

### 다크모드 지원 원칙

모든 컴포넌트는 다크모드를 지원해야 합니다.

```tsx
// Good: 다크모드 지원
<div className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
  <span className="text-red-600 dark:text-red-400">경고</span>
</div>

// Bad: 라이트모드만 지원
<div className="bg-red-50 border-red-200">
  <span className="text-red-600">경고</span>
</div>
```

### 다크모드 컬러 패턴

| 요소 | Light Mode | Dark Mode |
|------|------------|-----------|
| 배경 | `bg-red-50` | `bg-red-950/30` |
| 테두리 | `border-red-200` | `border-red-800` |
| 텍스트 | `text-red-600` | `text-red-400` |
| 아이콘 | `text-red-600` | `text-red-400` |

### CSS 변수 다크모드

```css
:root {
  --status-success: 142 76% 36%;
}

.dark {
  --status-success: 142 70% 45%; /* 밝기 조정 */
}
```

---

## ♿ 접근성

### 터치 타겟

모바일 접근성을 위해 최소 44x44px 터치 타겟을 보장합니다.

```tsx
import { SIZES } from '@/lib/constants/layouts';

<button className={SIZES.touchTarget}>
  <Icon className="h-4 w-4" />
</button>

// 또는
<button className="min-h-[44px] min-w-[44px]">
  <Icon className="h-4 w-4" />
</button>
```

### 명암비

WCAG 2.1 AA 기준을 충족합니다:
- 일반 텍스트: 최소 4.5:1
- 큰 텍스트 (18pt+): 최소 3:1

### 시맨틱 HTML

```tsx
// Good: 시맨틱 태그 사용
<nav>
  <ul>
    <li><Link to="/budget">예산</Link></li>
  </ul>
</nav>

// Bad: div 남용
<div>
  <div>
    <div><a href="/budget">예산</a></div>
  </div>
</div>
```

### ARIA 레이블

```tsx
// 아이콘 버튼
<Button variant="ghost" size="icon" aria-label="이전 달">
  <ChevronLeft className="h-4 w-4" />
</Button>

// 숨겨진 설명
<DialogDescription className="sr-only">
  카테고리를 선택하고 월별 예산 금액을 입력해 저장합니다.
</DialogDescription>
```

---

## 📦 컴포넌트 라이브러리

### shadcn/ui

프로젝트는 shadcn/ui를 기반으로 합니다.

**사용 가능한 컴포넌트:**
- Button
- Card
- Dialog
- Input
- Select
- Label
- 등등...

**커스터마이징:**
- 테마: `/src/index.css`의 CSS 변수 수정
- 컴포넌트: `/src/components/ui/` 파일 직접 수정 가능

### Lucide React Icons

아이콘은 Lucide React를 사용합니다.

```tsx
import { CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

<CreditCard className="h-4 w-4" />
<TrendingUp className="h-5 w-5 text-green-600" />
```

**표준 크기:**
- 작은 아이콘: `h-4 w-4` (16px)
- 중간 아이콘: `h-5 w-5` (20px)
- 큰 아이콘: `h-12 w-12` (48px, 빈 상태용)

---

## 🔧 개발 워크플로우

### 새 컴포넌트 생성 시

1. **디자인 확인**: 기존 컴포넌트 재사용 가능한지 확인
2. **다크모드 지원**: 모든 색상에 dark: 클래스 추가
3. **CSS 변수 사용**: 하드코딩 대신 CSS 변수 사용
4. **타입 정의**: TypeScript 인터페이스 명확히 정의
5. **접근성 고려**: ARIA 레이블, 시맨틱 HTML 사용

### 새 페이지 생성 시

```tsx
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LAYOUTS, SPACING } from '@/lib/constants/layouts';

export default function NewPage() {
  return (
    <div className={SPACING.section}>
      <PageHeader
        title="페이지 제목"
        action={/* 액션 버튼 */}
      />

      {/* 메인 컨텐츠 */}
      <div className={LAYOUTS.threeColumn}>
        {/* 카드들 */}
      </div>

      {/* 빈 상태 */}
      {data.length === 0 && (
        <EmptyState
          icon={<Icon className="h-12 w-12" />}
          title="데이터가 없습니다"
          description="설명"
        />
      )}
    </div>
  );
}
```

---

## 📚 참고 자료

### 내부 리소스
- `/src/index.css` - CSS 변수 정의
- `/src/lib/constants/layouts.ts` - 레이아웃 상수
- `/src/components/common/` - 공통 컴포넌트

### 외부 리소스
- [shadcn/ui](https://ui.shadcn.com/) - 컴포넌트 라이브러리
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Lucide Icons](https://lucide.dev/) - 아이콘 라이브러리
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - 접근성 가이드라인

---

## ✅ 체크리스트

새 기능을 추가하거나 수정할 때 다음을 확인하세요:

- [ ] CSS 변수 사용 (하드코딩 금지)
- [ ] 다크모드 지원 (모든 색상에 dark: 클래스)
- [ ] 타이포그래피 규칙 준수 (페이지 제목 text-2xl 등)
- [ ] 표준 레이아웃 패턴 사용 (LAYOUTS 상수)
- [ ] 표준 간격 사용 (SPACING 상수)
- [ ] 공통 컴포넌트 재사용 (PageHeader, EmptyState 등)
- [ ] 금액 표시에 tabular-nums 사용
- [ ] 터치 타겟 최소 44x44px
- [ ] ARIA 레이블 추가 (필요시)
- [ ] 시맨틱 HTML 사용

---

**마지막 업데이트:** 2025-12-29
**버전:** 1.0.0
