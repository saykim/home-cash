import { format, subMonths } from 'date-fns';
import type { Transaction, Category } from '@/types';

export interface RecurringPattern {
  categoryId: string;
  categoryName: string;
  averageAmount: number;
  occurrences: number;
  confidence: number; // 0-100
  months: string[]; // yyyy-MM format
  suggestion: string;
}

/**
 * Detect recurring transaction patterns from the last N months
 * @param transactions All transactions to analyze
 * @param categories All categories
 * @param monthsToAnalyze Number of months to look back (default: 3)
 * @returns Array of detected recurring patterns
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  categories: Category[],
  monthsToAnalyze: number = 3
): RecurringPattern[] {
  const today = new Date();
  const cutoffDate = subMonths(today, monthsToAnalyze);

  // Filter transactions from the last N months (expenses only)
  const recentTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return tx.type === 'EXPENSE' && txDate >= cutoffDate;
  });

  // Group transactions by category and month
  const categoryMonthMap = new Map<string, Map<string, number[]>>();

  recentTransactions.forEach((tx) => {
    const month = format(new Date(tx.date), 'yyyy-MM');

    if (!categoryMonthMap.has(tx.categoryId)) {
      categoryMonthMap.set(tx.categoryId, new Map());
    }

    const monthMap = categoryMonthMap.get(tx.categoryId)!;
    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }

    monthMap.get(month)!.push(tx.amount);
  });

  const patterns: RecurringPattern[] = [];

  // Analyze each category
  categoryMonthMap.forEach((monthMap, categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const monthlyTotals = new Map<string, number>();

    // Calculate total amount per month for this category
    monthMap.forEach((amounts, month) => {
      const total = amounts.reduce((sum, amt) => sum + amt, 0);
      monthlyTotals.set(month, total);
    });

    // Need at least 2 months to detect pattern
    if (monthlyTotals.size < 2) return;

    const months = Array.from(monthlyTotals.keys()).sort();
    const amounts = months.map((m) => monthlyTotals.get(m)!);

    // Calculate average and standard deviation
    const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (CV): lower is more consistent
    const cv = average > 0 ? (stdDev / average) * 100 : 100;

    // Consider it recurring if:
    // 1. CV < 20% (amounts are very consistent)
    // 2. OR average > 50,000 and CV < 30% (larger amounts allow more variance)
    const isRecurring = cv < 20 || (average > 50000 && cv < 30);

    if (isRecurring) {
      // Calculate confidence score (100 = perfect consistency)
      const confidence = Math.max(0, Math.min(100, 100 - cv));

      patterns.push({
        categoryId,
        categoryName: category.name,
        averageAmount: Math.round(average),
        occurrences: monthlyTotals.size,
        confidence: Math.round(confidence),
        months,
        suggestion: generateSuggestion(category.name, average, monthlyTotals.size)
      });
    }
  });

  // Sort by confidence (highest first)
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function generateSuggestion(categoryName: string, averageAmount: number, occurrences: number): string {
  const amountText = (averageAmount / 10000).toFixed(1);

  if (occurrences >= 3) {
    return `${categoryName} 카테고리에서 매월 약 ${amountText}만원의 반복 지출이 감지되었습니다. 정기 거래로 등록하시겠습니까?`;
  } else {
    return `${categoryName} 카테고리에서 최근 ${occurrences}개월간 약 ${amountText}만원의 유사한 지출이 발생했습니다.`;
  }
}

/**
 * Check if a recurring pattern already exists in RecurringTransactions
 * @param pattern The detected pattern
 * @param recurringTransactions Existing recurring transactions
 * @returns true if similar recurring transaction already exists
 */
export function isPatternAlreadyRegistered(
  pattern: RecurringPattern,
  recurringTransactions: any[]
): boolean {
  return recurringTransactions.some((rt) => {
    // Check if category matches and amount is within 10%
    const amountDiff = Math.abs(rt.amount - pattern.averageAmount) / pattern.averageAmount;
    return rt.categoryId === pattern.categoryId && rt.isActive && amountDiff < 0.1;
  });
}
