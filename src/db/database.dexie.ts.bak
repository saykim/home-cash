import Dexie, { Table } from 'dexie';
import type { Asset, Category, Transaction, CreditCard, BenefitTier, RecurringTransaction, Budget, AnnualEvent, TransactionTemplate } from '@/types';

export class LedgerDatabase extends Dexie {
  // Phase 1 Tables
  assets!: Table<Asset, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;

  // Phase 2 Tables
  creditCards!: Table<CreditCard, string>;
  benefitTiers!: Table<BenefitTier, string>;
  recurringTransactions!: Table<RecurringTransaction, string>;
  budgets!: Table<Budget, string>;

  // Phase 3 Tables
  annualEvents!: Table<AnnualEvent, string>;

  // Phase 5 Tables
  transactionTemplates!: Table<TransactionTemplate, string>;

  constructor() {
    super('SmartLedgerDB');

    this.version(1).stores({
      // Phase 1
      assets: 'id, name, type, createdAt',
      categories: 'id, name, kind, createdAt',
      transactions: 'id, date, type, assetId, categoryId, cardId, createdAt, [date+assetId]',

      // Phase 2 (미래 확장용)
      creditCards: 'id, name, linkedAssetId, createdAt',
      benefitTiers: 'id, cardId, threshold, createdAt'
    });

    // Version 2: Add recurring transactions and budgets
    this.version(2).stores({
      recurringTransactions: 'id, name, isActive, frequency, startDate, createdAt',
      budgets: 'id, categoryId, month, createdAt, [categoryId+month]'
    });

    // Version 3: Add annual events (연례 이벤트)
    this.version(3).stores({
      annualEvents: 'id, name, type, month, day, isActive, createdAt, [month+day]'
    });

    // Version 4: Add transaction templates
    this.version(4).stores({
      transactionTemplates: 'id, name, type, categoryId, createdAt'
    });
  }
}

export const db = new LedgerDatabase();
