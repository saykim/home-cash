import { useState, useEffect, useMemo } from "react";
import { transactionsApi } from "@/lib/api";
import { useCategories } from "./useCategories";
import {
  getPeriodRange,
  calculateChangeRate,
  getPreviousPeriod,
} from "@/lib/periodUtils";
import type {
  PeriodMode,
  PeriodStats,
  CategoryStat,
  Transaction,
} from "@/types";

export function usePeriodStats(
  mode: PeriodMode,
  date: Date
): PeriodStats & { loading: boolean } {
  const { allCategories } = useCategories();
  const [currentTransactions, setCurrentTransactions] = useState<Transaction[]>(
    []
  );
  const [previousTransactions, setPreviousTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);

  // 현재 기간
  const currentRange = useMemo(() => getPeriodRange(mode, date), [mode, date]);

  // 이전 기간
  const previousRange = useMemo(() => {
    const prevDate = getPreviousPeriod(mode, date);
    return getPeriodRange(mode, prevDate);
  }, [mode, date]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [current, previous] = await Promise.all([
          transactionsApi.getAll({
            startDate: currentRange.start,
            endDate: currentRange.end,
          }),
          transactionsApi.getAll({
            startDate: previousRange.start,
            endDate: previousRange.end,
          }),
        ]);
        setCurrentTransactions(
          current.map((t: any) => ({ ...t, amount: Number(t.amount) }))
        );
        setPreviousTransactions(
          previous.map((t: any) => ({ ...t, amount: Number(t.amount) }))
        );
      } catch (err) {
        console.error("Failed to fetch period stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [
    currentRange.start,
    currentRange.end,
    previousRange.start,
    previousRange.end,
  ]);

  // 통계 계산
  const stats = useMemo(() => {
    // 현재 기간 통계
    const totalIncome = currentTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpense;

    // 카테고리별 통계
    const categoryMap = new Map<string, number>();
    currentTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const current = categoryMap.get(t.categoryId) || 0;
        categoryMap.set(t.categoryId, current + t.amount);
      });

    const byCategory: CategoryStat[] = Array.from(categoryMap.entries())
      .map(([categoryId, amount]) => {
        const category = allCategories.find((c) => c.id === categoryId);
        return {
          categoryId,
          categoryName: category?.name || "기타",
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          color: category?.color || "#64748b",
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // 이전 기간 통계
    const prevIncome = previousTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const prevExpense = previousTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const prevNet = prevIncome - prevExpense;

    // 증감률 계산
    const incomeChange = calculateChangeRate(totalIncome, prevIncome);
    const expenseChange = calculateChangeRate(totalExpense, prevExpense);
    const netChange = calculateChangeRate(netAmount, prevNet);

    return {
      totalIncome,
      totalExpense,
      netAmount,
      transactionCount: currentTransactions.length,
      byCategory,
      change: {
        incomeChange,
        expenseChange,
        netChange,
      },
      loading,
    };
  }, [currentTransactions, previousTransactions, allCategories, loading]);

  return stats;
}
