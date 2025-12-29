import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useCreditCards, useBenefitTiers } from './useCreditCards';
import { useCardMonthlyPayments } from './useCardMonthlyPayments';
import { format, addMonths } from 'date-fns';

interface CardPerformance {
  cardId: string;
  cardName: string;
  currentMonthSpend: number;
  currentMonthTransactions: number;
  billingAmount: number;
  expectedAmount?: number; // 사용자가 입력한 예상 결제액
  hasExpectedAmount: boolean; // 예상 금액 입력 여부
  nextBillingDate: string;
  achievedTiers: BenefitTierStatus[];
  nextTier: BenefitTierStatus | null;
  remainingForNextTier: number;
}

interface BenefitTierStatus {
  id: string;
  threshold: number;
  description: string;
  achieved: boolean;
  progress: number;
}

export function useCardPerformance(month?: string) {
  const currentMonth = month || format(new Date(), 'yyyy-MM');
  const { transactions } = useTransactions(currentMonth);
  const { creditCards } = useCreditCards();
  const { allTiers } = useBenefitTiers();
  const { payments } = useCardMonthlyPayments(currentMonth);

  const performances = useMemo(() => {
    return creditCards.map((card): CardPerformance => {
      // Get card transactions for the month
      const cardTransactions = transactions.filter(
        (tx) => tx.cardId === card.id && tx.type === 'EXPENSE'
      );

      const currentMonthSpend = cardTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Get benefit tiers for this card
      const cardTiers = allTiers
        .filter((t) => t.cardId === card.id)
        .sort((a, b) => a.threshold - b.threshold);

      const tierStatuses: BenefitTierStatus[] = cardTiers.map((tier) => ({
        id: tier.id,
        threshold: tier.threshold,
        description: tier.description,
        achieved: currentMonthSpend >= tier.threshold,
        progress: Math.min((currentMonthSpend / tier.threshold) * 100, 100)
      }));

      const nextTier = tierStatuses.find((t) => !t.achieved) || null;
      const remainingForNextTier = nextTier ? nextTier.threshold - currentMonthSpend : 0;

      // Calculate next billing date
      const today = new Date();
      const billingDay = card.billingDay;
      let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), billingDay);

      if (today.getDate() >= billingDay) {
        nextBillingDate = addMonths(nextBillingDate, 1);
      }

      // Get expected amount if user has entered it
      const monthlyPayment = payments.find((p) => p.cardId === card.id);
      const hasExpectedAmount = Boolean(monthlyPayment);
      const expectedAmount = monthlyPayment?.expectedAmount;

      // Use expected amount if available, otherwise use current month spend
      const billingAmount = hasExpectedAmount ? expectedAmount! : currentMonthSpend;

      return {
        cardId: card.id,
        cardName: card.name,
        currentMonthSpend,
        currentMonthTransactions: cardTransactions.length,
        billingAmount,
        expectedAmount,
        hasExpectedAmount,
        nextBillingDate: format(nextBillingDate, 'yyyy-MM-dd'),
        achievedTiers: tierStatuses.filter((t) => t.achieved),
        nextTier,
        remainingForNextTier
      };
    });
  }, [creditCards, transactions, allTiers, currentMonth, payments]);

  const totalBillingAmount = performances.reduce((sum, p) => sum + p.billingAmount, 0);
  const totalTransactions = performances.reduce((sum, p) => sum + p.currentMonthTransactions, 0);

  return {
    performances,
    totalBillingAmount,
    totalTransactions
  };
}
