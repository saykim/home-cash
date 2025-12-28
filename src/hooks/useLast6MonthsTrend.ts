import { useState, useEffect, useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { transactionsApi } from '@/lib/api';
import type { Transaction } from '@/types';

export interface MonthTrendData {
  period: string; // Display label like "7월"
  monthStr: string; // YYYY-MM format for filtering
  income: number;
  expense: number;
}

export function useLast6MonthsTrend(): MonthTrendData[] {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Calculate date range for last 6 months
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const sixMonthsAgo = subMonths(today, 5);
    return {
      startDate: format(sixMonthsAgo, 'yyyy-MM-01'),
      endDate: format(today, 'yyyy-MM-dd')
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await transactionsApi.getAll({
          startDate,
          endDate
        });
        setTransactions(data.map((t: any) => ({ ...t, amount: Number(t.amount) })));
      } catch (err) {
        console.error('Failed to fetch 6-month trend data:', err);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const trendData = useMemo(() => {
    const today = new Date();
    const months: MonthTrendData[] = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      months.push({
        period: format(month, 'M월'),
        monthStr: format(month, 'yyyy-MM'),
        income: 0,
        expense: 0
      });
    }

    // Aggregate transactions by month
    transactions.forEach((t) => {
      const tMonth = t.date.substring(0, 7); // Extract 'yyyy-MM'
      const monthData = months.find((m) => m.monthStr === tMonth);
      if (monthData) {
        if (t.type === 'INCOME') {
          monthData.income += t.amount;
        } else if (t.type === 'EXPENSE') {
          monthData.expense += t.amount;
        }
      }
    });

    return months;
  }, [transactions]);

  return trendData;
}
