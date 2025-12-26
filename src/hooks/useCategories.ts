import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Category, CategoryKind } from '@/types';

export function useCategories(kind?: CategoryKind) {
  const allCategories = useLiveQuery(() => db.categories.toArray()) ?? [];

  const categories = kind
    ? allCategories.filter((c) => c.kind === kind)
    : allCategories;

  const incomeCategories = allCategories.filter((c) => c.kind === 'INCOME');
  const expenseCategories = allCategories.filter((c) => c.kind === 'EXPENSE');

  const addCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    await db.categories.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now
    });
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    await db.categories.update(id, data);
  };

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id);
  };

  return {
    categories,
    allCategories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory
  };
}
