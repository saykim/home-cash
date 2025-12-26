import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { RecurringTransaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useRecurringTransactions() {
  const recurringTransactions = useLiveQuery(
    () => db.recurringTransactions.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const addRecurringTransaction = async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newRecurring: RecurringTransaction = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    await db.recurringTransactions.add(newRecurring);
    return newRecurring;
  };

  const updateRecurringTransaction = async (id: string, data: Partial<RecurringTransaction>) => {
    await db.recurringTransactions.update(id, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteRecurringTransaction = async (id: string) => {
    await db.recurringTransactions.delete(id);
  };

  const toggleActiveStatus = async (id: string) => {
    const recurring = await db.recurringTransactions.get(id);
    if (recurring) {
      await updateRecurringTransaction(id, { isActive: !recurring.isActive });
    }
  };

  return {
    recurringTransactions,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleActiveStatus
  };
}
