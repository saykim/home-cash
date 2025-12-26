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
    try {
      await creditCardsApi.create(data);
      await fetchCreditCards();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add credit card"
      );
      throw err;
    }
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCard>) => {
    try {
      await creditCardsApi.update(id, data);
      await fetchCreditCards();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update credit card"
      );
      throw err;
    }
  };

  const deleteCreditCard = async (id: string) => {
    try {
      await creditCardsApi.delete(id);
      await fetchCreditCards();
    } catch (err) {
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
