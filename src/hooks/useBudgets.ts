import { useState, useEffect, useCallback } from "react";
import { budgetsApi } from "@/lib/api";
import type { Budget } from "@/types";

export function useBudgets(month?: string) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await budgetsApi.getAll(month);
      // Convert decimal strings to numbers
      const normalized = data.map((b: any) => ({
        ...b,
        amount: Number(b.amount),
      }));
      setBudgets(normalized);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch budgets");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (
    categoryId: string,
    amount: number,
    targetMonth: string
  ) => {
    try {
      const result = await budgetsApi.create({
        categoryId,
        amount,
        month: targetMonth,
      });
      await fetchBudgets();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add budget");
      throw err;
    }
  };

  const updateBudget = async (id: string, amount: number) => {
    try {
      await budgetsApi.update(id, { amount });
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget");
      throw err;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await budgetsApi.delete(id);
      await fetchBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete budget");
      throw err;
    }
  };

  const getBudgetByCategory = async (
    categoryId: string,
    targetMonth: string
  ) => {
    return budgets.find(
      (b) => b.categoryId === categoryId && b.month === targetMonth
    );
  };

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    refetch: fetchBudgets,
  };
}
