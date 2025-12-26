import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useCategories } from './useCategories';
import type { CategoryStat } from '@/types';

export function useStatistics(month?: string) {
  const { transactions } = useTransactions(month);
  const { allCategories } = useCategories();

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown for expenses
    const categoryMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const current = categoryMap.get(t.categoryId) || 0;
        categoryMap.set(t.categoryId, current + t.amount);
      });

    const byCategory: CategoryStat[] = Array.from(categoryMap.entries()).map(
      ([categoryId, amount]) => {
        const category = allCategories.find((c) => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || '기타',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          color: category?.color || '#64748b'
        };
      }
    );

    byCategory.sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      byCategory,
      transactionCount: transactions.length
    };
  }, [transactions, allCategories]);

  return stats;
}
