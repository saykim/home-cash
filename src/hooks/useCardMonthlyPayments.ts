import { useState, useEffect, useCallback } from "react";
import { cardMonthlyPaymentsApi } from "@/lib/api";
import type { CardMonthlyPayment } from "@/types";

export function useCardMonthlyPayments(month: string) {
  const [payments, setPayments] = useState<CardMonthlyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cardMonthlyPaymentsApi.getByMonth(month);
      // Convert decimal strings to numbers
      const normalized = data.map((p: any) => ({
        ...p,
        expectedAmount: Number(p.expectedAmount),
      }));
      setPayments(normalized);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch card monthly payments"
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const addPayment = async (
    data: Omit<CardMonthlyPayment, "id" | "createdAt" | "updatedAt">
  ) => {
    // Optimistic update
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticPayment: CardMonthlyPayment = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setPayments((prev) => [...prev, optimisticPayment]);

    try {
      const created = await cardMonthlyPaymentsApi.create(data);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? {
                ...created,
                expectedAmount: Number(created.expectedAmount),
              }
            : p
        )
      );
      setError(null);
    } catch (err) {
      setPayments((prev) => prev.filter((p) => p.id !== tempId));
      setError(
        err instanceof Error ? err.message : "Failed to add card monthly payment"
      );
      throw err;
    }
  };

  const updatePayment = async (id: string, data: Partial<CardMonthlyPayment>) => {
    // Optimistic update
    const previousPayments = payments;
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
      )
    );

    try {
      const updated = await cardMonthlyPaymentsApi.update(id, data);
      setPayments((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...updated,
                expectedAmount: Number(updated.expectedAmount),
              }
            : p
        )
      );
      setError(null);
    } catch (err) {
      setPayments(previousPayments);
      setError(
        err instanceof Error ? err.message : "Failed to update card monthly payment"
      );
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    // Optimistic update
    const previousPayments = payments;
    setPayments((prev) => prev.filter((p) => p.id !== id));

    try {
      await cardMonthlyPaymentsApi.delete(id);
      setError(null);
    } catch (err) {
      setPayments(previousPayments);
      setError(
        err instanceof Error ? err.message : "Failed to delete card monthly payment"
      );
      throw err;
    }
  };

  return {
    payments,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
}
