import { useState, useEffect, useCallback } from "react";
import { creditCardsApi } from "@/lib/api";
import type { CreditCard, BenefitTier } from "@/types";

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await creditCardsApi.getAll();
      setCreditCards(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch credit cards"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditCards();
  }, [fetchCreditCards]);

  const addCreditCard = async (
    data: Omit<CreditCard, "id" | "createdAt" | "updatedAt">
  ) => {
    // Optimistic update: 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticCard: CreditCard = {
      ...data,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };
    setCreditCards((prev) => [...prev, optimisticCard]);

    try {
      const created = await creditCardsApi.create(data);
      // 임시 데이터를 실제 서버 응답으로 교체
      setCreditCards((prev) =>
        prev.map((c) => (c.id === tempId ? created : c))
      );
      setError(null);
    } catch (err) {
      // 실패 시 optimistic update 롤백
      setCreditCards((prev) => prev.filter((c) => c.id !== tempId));
      setError(
        err instanceof Error ? err.message : "Failed to add credit card"
      );
      throw err;
    }
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCard>) => {
    // Optimistic update: 즉시 로컬 상태 업데이트
    const previousCards = creditCards;
    setCreditCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      )
    );

    try {
      const updated = await creditCardsApi.update(id, data);
      // 실제 서버 응답으로 교체
      setCreditCards((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setCreditCards(previousCards);
      setError(
        err instanceof Error ? err.message : "Failed to update credit card"
      );
      throw err;
    }
  };

  const deleteCreditCard = async (id: string) => {
    // Optimistic update: 즉시 로컬에서 제거
    const previousCards = creditCards;
    setCreditCards((prev) => prev.filter((c) => c.id !== id));

    try {
      await creditCardsApi.delete(id);
      setError(null);
    } catch (err) {
      // 실패 시 롤백
      setCreditCards(previousCards);
      setError(
        err instanceof Error ? err.message : "Failed to delete credit card"
      );
      throw err;
    }
  };

  return {
    creditCards,
    loading,
    error,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refetch: fetchCreditCards,
  };
}

// Note: BenefitTiers API not yet implemented - can be added if needed
export function useBenefitTiers(cardId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [allTiers, _setAllTiers] = useState<BenefitTier[]>([]);

  const tiers = cardId ? allTiers.filter((t) => t.cardId === cardId) : allTiers;

  const addBenefitTier = async (
    _data: Omit<BenefitTier, "id" | "createdAt">
  ) => {
    // TODO: Implement API call
    console.warn("useBenefitTiers API not yet implemented");
  };

  const updateBenefitTier = async (
    _id: string,
    _data: Partial<BenefitTier>
  ) => {
    // TODO: Implement API call
    console.warn("useBenefitTiers API not yet implemented");
  };

  const deleteBenefitTier = async (_id: string) => {
    // TODO: Implement API call
    console.warn("useBenefitTiers API not yet implemented");
  };

  return {
    tiers,
    allTiers,
    addBenefitTier,
    updateBenefitTier,
    deleteBenefitTier,
  };
}
