// Asset types
export type AssetType = 'BANK' | 'CASH';

// Category types
export type CategoryKind = 'INCOME' | 'EXPENSE';

// Transaction types
export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

// Recurring frequency types
export type RecurringFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

// Event types (연례 이벤트)
export type EventType = 'BIRTHDAY' | 'CELEBRATION' | 'CONDOLENCE' | 'ANNIVERSARY' | 'OTHER';

// Phase 1 Interfaces
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  initialBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  assetId: string;
  toAssetId?: string;
  categoryId: string;
  cardId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// Phase 2 Interfaces (스키마만 정의)
export interface CreditCard {
  id: string;
  name: string;
  billingDay: number;
  startOffset: number;
  startDay: number;
  endOffset: number;
  endDay: number;
  linkedAssetId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenefitTier {
  id: string;
  cardId: string;
  threshold: number;
  description: string;
  createdAt: string;
}

// Recurring Transaction Interface
export interface RecurringTransaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  assetId: string;
  toAssetId?: string;
  categoryId: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  dayOfMonth?: number; // For monthly (1-31)
  dayOfWeek?: number; // For weekly (0-6, 0=Sunday)
  lastGenerated?: string;
  isActive: boolean;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// Budget Interface
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // Format: yyyy-MM
  createdAt: string;
  updatedAt: string;
}

// Annual Event Interface (연례 이벤트)
export interface AnnualEvent {
  id: string;
  name: string;
  type: EventType;
  month: number;        // 1-12
  day: number;          // 1-31
  amount?: number;      // 예산 금액 (선택)
  memo?: string;
  firstYear?: number;   // 첫 발생 연도 (나이 계산용)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// UI Helper Types
export interface DayData {
  date: Date;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  isNoSpendDay: boolean;
}

export interface MonthlyStats {
  month: string;
  totalIncome: number;
  totalExpense: number;
  byCategory: CategoryStat[];
}

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

// Transaction Template Interface
export interface TransactionTemplate {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  assetId: string;
  toAssetId?: string;
  categoryId: string;
  cardId?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// Period types (일/주/월 기능)
export type PeriodMode = 'day' | 'week' | 'month';

export interface PeriodRange {
  start: string;  // yyyy-MM-dd
  end: string;    // yyyy-MM-dd
  label: string;  // 화면 표시용
}

export interface PeriodStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
  byCategory: CategoryStat[];
  change: {
    incomeChange: number;
    expenseChange: number;
    netChange: number;
  };
}
