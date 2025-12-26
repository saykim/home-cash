import { useState, useEffect, useCallback } from "react";
import { recurringTransactionsApi } from "@/lib/api";
import type { RecurringTransaction } from "@/types";

export function useRecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecurringTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await recurringTransactionsApi.getAll();
      // Convert decimal strings to numbers
      const normalized = data.map((r: any) => ({
        ...r,
        amount: Number(r.amount),
      }));
      setRecurringTransactions(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch recurring transactions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurringTransactions();
  }, [fetchRecurringTransactions]);

  const addRecurringTransaction = async (
    data: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const result = await recurringTransactionsApi.create(data);
      await fetchRecurringTransactions();
      return result;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add recurring transaction"
      );
      throw err;
    }
  };

  const updateRecurringTransaction = async (
    id: string,
    data: Partial<RecurringTransaction>
  ) => {
    try {
      await recurringTransactionsApi.update(id, data);
      await fetchRecurringTransactions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update recurring transaction"
      );
      throw err;
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    try {
      await recurringTransactionsApi.delete(id);
      await fetchRecurringTransactions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete recurring transaction"
      );
      throw err;
    }
  };

  const toggleActiveStatus = async (id: string) => {
    const recurring = recurringTransactions.find((r) => r.id === id);
    if (recurring) {
      await updateRecurringTransaction(id, { isActive: !recurring.isActive });
    }
  };

  return {
    recurringTransactions,
    loading,
    error,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    toggleActiveStatus,
    refetch: fetchRecurringTransactions,
  };
}
