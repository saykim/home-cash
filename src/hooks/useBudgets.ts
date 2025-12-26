import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { Budget } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

export function useBudgets(month?: string) {
  const currentMonth = month || format(new Date(), 'yyyy-MM');

  const budgets = useLiveQuery(
    () => {
      if (month) {
        return db.budgets.where('month').equals(currentMonth).toArray();
      }
      return db.budgets.toArray();
    },
    [currentMonth]
  ) || [];

  const addBudget = async (categoryId: string, amount: number, targetMonth: string) => {
    const now = new Date().toISOString();

    // Check if budget already exists for this category and month
    const existing = await db.budgets
      .where('[categoryId+month]')
      .equals([categoryId, targetMonth])
      .first();

    if (existing) {
      // Update existing budget
      await db.budgets.update(existing.id, {
        amount,
        updatedAt: now
      });
      return existing;
    }

    // Create new budget
    const newBudget: Budget = {
      id: uuidv4(),
      categoryId,
      amount,
      month: targetMonth,
      createdAt: now,
      updatedAt: now
    };

    await db.budgets.add(newBudget);
    return newBudget;
  };

  const updateBudget = async (id: string, amount: number) => {
    await db.budgets.update(id, {
      amount,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteBudget = async (id: string) => {
    await db.budgets.delete(id);
  };

  const getBudgetByCategory = async (categoryId: string, targetMonth: string) => {
    return await db.budgets
      .where('[categoryId+month]')
      .equals([categoryId, targetMonth])
      .first();
  };

  return {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory
  };
}
