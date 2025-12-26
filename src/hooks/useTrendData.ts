import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { getTrendPeriods, getPeriodRange, formatTrendLabel } from '@/lib/periodUtils';
import type { PeriodMode } from '@/types';

interface TrendData {
  period: string;
  income: number;
  expense: number;
}

export function useTrendData(mode: PeriodMode, currentDate: Date): TrendData[] {
  const periods = useMemo(() => getTrendPeriods(mode, currentDate), [mode, currentDate]);

  // 전체 기간 범위 계산
  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  const startRange = getPeriodRange(mode, firstPeriod);
  const endRange = getPeriodRange(mode, lastPeriod);

  // 한 번에 모든 거래 조회
  const allTransactions = useLiveQuery(async () => {
    return db.transactions
      .where('date')
      .between(startRange.start, endRange.end, true, true)
      .toArray();
  }, [startRange.start, endRange.end]) ?? [];

  // 기간별로 데이터 집계
  const trendData = useMemo(() => {
    return periods.map(date => {
      const range = getPeriodRange(mode, date);

      const periodTransactions = allTransactions.filter(
        tx => tx.date >= range.start && tx.date <= range.end
      );

      const income = periodTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = periodTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        period: formatTrendLabel(mode, date),
        income,
        expense
      };
    });
  }, [periods, allTransactions, mode]);

  return trendData;
}
