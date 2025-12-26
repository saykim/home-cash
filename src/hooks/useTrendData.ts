import { useState, useEffect, useMemo } from "react";
import { transactionsApi } from "@/lib/api";
import {
  getTrendPeriods,
  getPeriodRange,
  formatTrendLabel,
} from "@/lib/periodUtils";
import type { PeriodMode, Transaction } from "@/types";

interface TrendData {
  period: string;
  income: number;
  expense: number;
}

export function useTrendData(mode: PeriodMode, currentDate: Date): TrendData[] {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const periods = useMemo(
    () => getTrendPeriods(mode, currentDate),
    [mode, currentDate]
  );

  // 전체 기간 범위 계산
  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  const startRange = useMemo(
    () => getPeriodRange(mode, firstPeriod),
    [mode, firstPeriod]
  );
  const endRange = useMemo(
    () => getPeriodRange(mode, lastPeriod),
    [mode, lastPeriod]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await transactionsApi.getAll({
          startDate: startRange.start,
          endDate: endRange.end,
        });
        setAllTransactions(
          data.map((t: any) => ({ ...t, amount: Number(t.amount) }))
        );
      } catch (err) {
        console.error("Failed to fetch trend data:", err);
      }
    };
    fetchData();
  }, [startRange.start, endRange.end]);

  // 기간별로 데이터 집계
  const trendData = useMemo(() => {
    return periods.map((date) => {
      const range = getPeriodRange(mode, date);

      const periodTransactions = allTransactions.filter(
        (tx) => tx.date >= range.start && tx.date <= range.end
      );

      const income = periodTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = periodTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        period: formatTrendLabel(mode, date),
        income,
        expense,
      };
    });
  }, [periods, allTransactions, mode]);

  return trendData;
}
