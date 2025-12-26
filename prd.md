# 📄 가계부 웹 서비스 PRD (Phase 1 → Phase 2 확장형)

---

## 1. 프로젝트 개요

* **제품명(가칭)**: Smart Ledger
* **1차 목적**: 자산·수입·지출을 정확히 기록하고 잔액을 실시간 파악
* **확장 목적**: 카드 결제일·실적·혜택을 트래킹해 현금 흐름을 예측하고 ‘체리피킹’ 최적화


### 핵심 개발 전략

1. **Phase 1 (Basic Ledger)** – 자산/거래/통계 & 캘린더
2. **Phase 2 (Cherry-Picker Extension)** – 카드 청구일·부채·혜택 엔진


---

## 2. 대상 사용자

| 페르소나    | 주요 Pain-Point    | 기대 가치               |
| ------- | ---------------- | ------------------- |
| 사회 초년생  | 잔액·지출 흐름 파악이 어려움 | 쉽고 빠른 입력, 잔액 실시간 표시 |
| 다카드 사용자 | 결제일·실적 혼란        | 청구일/실적 자동 계산·알림     |
| 재테커     | 카드 혜택 놓침         | 남은 실적·예상 혜택 대시보드    |

---

## 3. 기능 요구사항

### 3-1. Phase 1 — Basic Ledger

| 모듈        | 상세 기능                             |
| --------- | --------------------------------- |
| **자산**    | 계좌/현금 초기 잔액, 현재 잔액, 유형(BANK/CASH) |
| **카테고리**  | 대·중분류 CRUD                        |
| **거래 입력** | 날짜·시간, 자산, 금액(+/-), 카테고리, 메모      |
| **조회**    | ◾ 리스트 뷰<br>◾ 캘린더 뷰(무지출 체크)        |
| **통계**    | 월간 카테고리별 파이, 수입/지출 막대             |
| **검색**    | 금액·키워드·카테고리 필터                    |

### 3-2. Phase 2 — Cherry Picker

| 모듈                     | 상세 기능                            |
| ---------------------- | -------------------------------- |
| **Credit Card**        | 결제일, 이용기간 offset(시작·종료), 결제계좌 연결 |
| **Billing Engine**     | 사용일 → 청구일 계산(14일·25일 등 매핑)       |
| **부채 관리**              | 월별 결제 예정 금액, D-day 알림            |
| **Performance Engine** | 전월 1일~말일 또는 청구기간 실적 합산           |
| **혜택 Tier**            | 30 / 60 / 80 만원 등 구간‧혜택 등록       |
| **체리피커 대시보드**          | 실적 게이지, 부족액, 예상 혜택, 토스트 축하       |

---

## 4. 데이터 모델 (TypeScript Interface 요약)

```ts
// Phase 1
interface Asset { id:string; name:string; type:'BANK'|'CASH'; balance:number; }
interface Category { id:string; name:string; kind:'INCOME'|'EXPENSE'; }
interface Transaction {
  id:string; date:string; type:'INCOME'|'EXPENSE'|'TRANSFER';
  amount:number; assetId:string; categoryId:string; memo?:string;
}

// Phase 2 추가
interface CreditCard {
  id:string; name:string; billingDay:number;
  startOffset:number; startDay:number; endOffset:number; endDay:number;
  linkedAssetId:string;
}
interface BenefitTier { id:string; cardId:string; threshold:number; description:string; }
interface CardTransactionExtension {
  transactionId:string; cardId:string;
  billingDate:string; excludePerformance:boolean;
}
```

---

## 5. 기술 스택 & 아키텍처

| 단계       | 프런트                            | 상태/스토리지                  | 백엔드/DB                    | 배포                |
| -------- | ------------------------------ | ------------------------ | ------------------------- | ----------------- |
| MVP ✅    | **Vite + React/TS** · Tailwind · shadcn/ui | Dexie.js + dexie-react-hooks (IndexedDB)      | 없음(로컬)                    | Vercel Static     |
| Scale-up | Next.js App Router             | TANStack Query + Zustand | Vercel Postgres or SQLite | Vercel Serverless |

### 추가 기술 스택 (구현됨)
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반)
- **차트**: Recharts
- **폼 관리**: react-hook-form + zod
- **날짜 처리**: date-fns (Korean locale)
- **PWA**: vite-plugin-pwa

---

## 6. 개발 로드맵

| 상태 | 주차 | 목표             | 주요 작업                        |
| --- | -- | -------------- | ---------------------------- |
| ✅ | 1주 | 환경 구성          | Vite 프로젝트·Tailwind·shadcn/ui·Dexie 스키마 |
| ✅ | 2주 | 자산·거래 CRUD     | 입력 폼, 리스트, 잔액 계산, Custom Hooks |
| ✅ | 3주 | 캘린더·통계         | 캘린더 컴포넌트, Recharts 도입, 파이차트 |
| ✅ | 4주 | **Phase 1 완료** | 설정 페이지, 모바일 반응형, PWA 지원 |
| 📅 | 5주 | 카드 모듈          | CreditCard 스키마, Billing 함수   |
| 📅 | 6주 | 부채·혜택          | Performance 엔진, 대시보드 UI      |
| 📅 | 7주 | 알림·테스트         | Toast 알림·유닛 테스트              |
| 📅 | 8주 | **Phase 2 완성** | 코드 정리, 문서화, 배포               |

### Phase 1 구현 완료 ✅

**구현된 주요 기능:**
- ✅ 홈 대시보드 (총 자산, 월간 수입/지출, 최근 거래)
- ✅ 거래 입력 폼 (수입/지출/이체, 실시간 잔액 동기화)
- ✅ 거래 목록 (월별 필터링, 삭제 기능)
- ✅ 캘린더 뷰 (월별 달력, 일별 거래 표시, 무지출일 강조)
- ✅ 통계 (카테고리별 파이차트, 월간 요약, 상세 리스트)
- ✅ 설정 (자산 관리, 카테고리 관리)
- ✅ PWA 지원 (오프라인, 홈 화면 설치)
- ✅ 모바일 최적화 (하단 네비게이션, 터치 친화적 UI)
- ✅ 한국어 로케일 (날짜, 통화 포맷)

---

## 7. 리스크 & 대응

| 리스크          | 영향           | 대응                             |
| ------------ | ------------ | ------------------------------ |
| 날짜 경계(월말·윤년) | 청구일 계산 오류    | date-fns 사용·단위 테스트             |
| 데이터 마이그레이션   | 로컬 → 클라우드 충돌 | UUID 사용·중복 병합 스크립트             |
| 사용자 초기 구성 피로 | 이탈 위험        | 기본 샘플 자산·카테고리 제공, 카드 설정 Wizard |

---

## 8. 향후 확장 아이디어

1. **OCR 영수증 스캔** → 자동 입력
2. **Open Banking API** 연동 → 잔액 자동 동기화
3. **AI 소비 분석** → 이상·절감 추천

---

### ✅ 결정 사항

* **Phase 1**(기본 가계부)부터 구현 후 **Phase 2**(카드 체리피커)로 확장
* 데이터 모델은 처음부터 UUID·분리 스키마로 설계해 이관 비용 최소화

