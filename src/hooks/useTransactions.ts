import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { useAssets } from './useAssets';
import type { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export function useTransactions(month?: string) {
  const { updateBalance } = useAssets();

  // Get transactions for a specific month or all
  const transactions = useLiveQuery(async () => {
    let query = db.transactions.orderBy('date').reverse();

    if (month) {
      const start = format(startOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd');
      const end = format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd');
      return query.filter((t) => t.date >= start && t.date <= end).toArray();
    }

    return query.toArray();
  }, [month]) ?? [];

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const tx: Transaction = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    await db.transaction('rw', [db.transactions, db.assets], async () => {
      await db.transactions.add(tx);

      // Update asset balance
      if (data.type === 'INCOME') {
        await updateBalance(data.assetId, data.amount);
      } else if (data.type === 'EXPENSE') {
        await updateBalance(data.assetId, -data.amount);
      } else if (data.type === 'TRANSFER' && data.toAssetId) {
        await updateBalance(data.assetId, -data.amount);
        await updateBalance(data.toAssetId, data.amount);
      }
    });
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    await db.transactions.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteTransaction = async (id: string) => {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    await db.transaction('rw', [db.transactions, db.assets], async () => {
      await db.transactions.delete(id);

      // Reverse the balance change
      if (tx.type === 'INCOME') {
        await updateBalance(tx.assetId, -tx.amount);
      } else if (tx.type === 'EXPENSE') {
        await updateBalance(tx.assetId, tx.amount);
      } else if (tx.type === 'TRANSFER' && tx.toAssetId) {
        await updateBalance(tx.assetId, tx.amount);
        await updateBalance(tx.toAssetId, -tx.amount);
      }
    });
  };

  return {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  };
}
