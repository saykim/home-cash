import { db } from './database';
import type { Asset, Category } from '@/types';

const generateId = () => crypto.randomUUID();

export const defaultAssets: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '주거래 통장',
    type: 'BANK',
    balance: 1500000,
    initialBalance: 1500000
  },
  {
    name: '현금 지갑',
    type: 'CASH',
    balance: 50000,
    initialBalance: 50000
  }
];

export const defaultCategories: Omit<Category, 'id' | 'createdAt'>[] = [
  // Income Categories
  { name: '급여', kind: 'INCOME', icon: 'Briefcase', color: '#22c55e' },
  { name: '부수입', kind: 'INCOME', icon: 'TrendingUp', color: '#10b981' },
  { name: '용돈', kind: 'INCOME', icon: 'Gift', color: '#14b8a6' },

  // Expense Categories
  { name: '식비', kind: 'EXPENSE', icon: 'UtensilsCrossed', color: '#ef4444' },
  { name: '교통', kind: 'EXPENSE', icon: 'Car', color: '#f97316' },
  { name: '쇼핑', kind: 'EXPENSE', icon: 'ShoppingBag', color: '#eab308' },
  { name: '문화/여가', kind: 'EXPENSE', icon: 'Film', color: '#a855f7' },
  { name: '의료/건강', kind: 'EXPENSE', icon: 'Heart', color: '#ec4899' },
  { name: '주거/통신', kind: 'EXPENSE', icon: 'Home', color: '#6366f1' },
  { name: '기타', kind: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748b' }
];

export async function seedDatabase() {
  const assetCount = await db.assets.count();
  if (assetCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  const now = new Date().toISOString();

  // Seed assets
  const assetRecords = defaultAssets.map((a) => ({
    ...a,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  }));
  await db.assets.bulkAdd(assetRecords);

  // Seed categories
  const categoryRecords = defaultCategories.map((c) => ({
    ...c,
    id: generateId(),
    createdAt: now
  }));
  await db.categories.bulkAdd(categoryRecords);

  console.log('Database seeded successfully!');
}
