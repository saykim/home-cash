import { useState, useEffect, useCallback } from "react";
import { transactionsApi } from "@/lib/api";
import type { Transaction } from "@/types";

export function useTransactions(month?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionsApi.getAll(month ? { month } : undefined);
      // Convert decimal strings to numbers
      const normalized = data.map((t: any) => ({
        ...t,
        amount: Number(t.amount),
      }));
      setTransactions(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await transactionsApi.create(data);
      await fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add transaction"
      );
      throw err;
    }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      await transactionsApi.update(id, data);
      await fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update transaction"
      );
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.delete(id);
      await fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete transaction"
      );
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
