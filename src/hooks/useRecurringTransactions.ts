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
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticTransaction: RecurringTransaction = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setRecurringTransactions((prev) => [...prev, optimisticTransaction]);

    try {
      const result = await recurringTransactionsApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setRecurringTransactions((prev) =>
        prev.map((r) =>
          r.id === tempId
            ? { ...result, amount: Number(result.amount) }
            : r
        )
      );
      setError(null);
      return result;
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setRecurringTransactions((prev) => prev.filter((r) => r.id !== tempId));
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
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousTransactions = recurringTransactions;
    setRecurringTransactions((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      )
    );

    try {
      const updated = await recurringTransactionsApi.update(id, data);
      // 실제 서버 응답으로 교체
      setRecurringTransactions((prev) =>
        prev.map((r) =>
          r.id === id ? { ...updated, amount: Number(updated.amount) } : r
        )
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setRecurringTransactions(previousTransactions);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update recurring transaction"
      );
      throw err;
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousTransactions = recurringTransactions;
    setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));

    try {
      await recurringTransactionsApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setRecurringTransactions(previousTransactions);
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
