import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import type { CreditCard, BenefitTier } from '@/types';

export function useCreditCards() {
  const creditCards = useLiveQuery(() => db.creditCards.toArray()) ?? [];

  const addCreditCard = async (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.creditCards.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    });
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCard>) => {
    await db.creditCards.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteCreditCard = async (id: string) => {
    // Delete associated benefit tiers first
    const tiers = await db.benefitTiers.where('cardId').equals(id).toArray();
    await Promise.all(tiers.map((tier) => db.benefitTiers.delete(tier.id)));

    // Delete the card
    await db.creditCards.delete(id);
  };

  return {
    creditCards,
    addCreditCard,
    updateCreditCard,
    deleteCreditCard
  };
}

export function useBenefitTiers(cardId?: string) {
  const allTiers = useLiveQuery(() => db.benefitTiers.toArray()) ?? [];

  const tiers = cardId
    ? allTiers.filter((t) => t.cardId === cardId)
    : allTiers;

  const addBenefitTier = async (data: Omit<BenefitTier, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    await db.benefitTiers.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now
    });
  };

  const updateBenefitTier = async (id: string, data: Partial<BenefitTier>) => {
    await db.benefitTiers.update(id, data);
  };

  const deleteBenefitTier = async (id: string) => {
    await db.benefitTiers.delete(id);
  };

  return {
    tiers,
    allTiers,
    addBenefitTier,
    updateBenefitTier,
    deleteBenefitTier
  };
}
