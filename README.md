# Smart Ledger 💰

스마트 가계부 - 자산과 지출을 쉽게 관리하세요

## 기능

### Phase 1 (현재 구현됨)
- ✅ **자산 관리** - 계좌와 현금 자산을 추가하고 잔액을 실시간 추적
- ✅ **거래 입력** - 수입, 지출, 이체를 간편하게 기록
- ✅ **거래 목록** - 월별 거래 내역 조회 및 삭제
- ✅ **캘린더 뷰** - 월별 달력으로 거래 내역 확인, 무지출일 표시
- ✅ **통계** - 카테고리별 지출 파이차트, 월간 수입/지출 요약
- ✅ **설정** - 자산 및 카테고리 관리
- ✅ **PWA 지원** - 오프라인 사용 가능, 홈 화면 설치

### Phase 2 (향후 계획)
- 📅 신용카드 관리
- 💳 카드 결제일 추적
- 🎁 카드 혜택 트래킹
- 📊 실적 및 부채 관리

## 기술 스택

- **Frontend**: Vite + React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: Dexie.js (IndexedDB)
- **Charts**: Recharts
- **Date**: date-fns (Korean locale)
- **PWA**: vite-plugin-pwa

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어보세요.

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── components/
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   ├── layout/             # 레이아웃 컴포넌트 (AppLayout, BottomNav)
│   ├── transactions/       # 거래 관련 컴포넌트
│   └── statistics/         # 통계 차트 컴포넌트
├── db/
│   ├── database.ts         # Dexie 데이터베이스 스키마
│   └── seed.ts             # 초기 샘플 데이터
├── hooks/
│   ├── useAssets.ts        # 자산 CRUD hooks
│   ├── useCategories.ts    # 카테고리 CRUD hooks
│   ├── useTransactions.ts  # 거래 CRUD hooks
│   └── useStatistics.ts    # 통계 계산 hooks
├── lib/
│   ├── utils.ts            # 유틸리티 함수
│   ├── formatters.ts       # 통화/날짜 포맷팅
│   └── constants.ts        # 상수
├── pages/
│   ├── HomePage.tsx        # 홈 화면 (대시보드)
│   ├── TransactionsPage.tsx # 거래 목록
│   ├── CalendarPage.tsx    # 캘린더 뷰
│   ├── StatisticsPage.tsx  # 통계
│   └── SettingsPage.tsx    # 설정
├── types/
│   └── index.ts            # TypeScript 타입 정의
├── App.tsx                 # 라우터 설정
└── main.tsx                # 앱 진입점
```

## 주요 기능 사용법

### 거래 추가
1. 우측 하단의 + 버튼 클릭
2. 수입/지출/이체 탭 선택
3. 날짜, 금액, 자산, 카테고리 입력
4. 저장 버튼 클릭

### 자산 관리
1. 하단 네비게이션에서 "설정" 탭 클릭
2. "자산 관리" 섹션에서 + 추가 버튼 클릭
3. 자산명, 유형(계좌/현금), 초기 잔액 입력
4. 저장

### 카테고리 추가
1. 설정 페이지에서 "카테고리 관리" 섹션으로 이동
2. + 추가 버튼 클릭
3. 카테고리명과 유형(수입/지출) 선택
4. 저장

## 데이터 저장

모든 데이터는 브라우저의 IndexedDB에 로컬로 저장됩니다.
- 서버 없이 완전히 오프라인으로 작동
- 데이터는 브라우저에만 저장되어 개인정보 보호
- 브라우저 데이터를 삭제하면 모든 기록이 삭제됩니다

## 배포

### Vercel 배포

```bash
npm install -g vercel
vercel
```

### 기타 정적 호스팅 서비스
`dist/` 폴더를 Netlify, GitHub Pages 등에 배포할 수 있습니다.

## 라이선스

MIT

## 기여

이슈와 Pull Request는 언제나 환영합니다!
