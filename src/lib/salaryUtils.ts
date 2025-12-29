import { parseISO, isBefore, isAfter, isSameDay, subDays } from 'date-fns';
import type { Category, Transaction } from '@/types';

/**
 * 카테고리 목록에서 급여 카테고리 ID를 찾습니다.
 * 현재는 "급여"라는 이름의 카테고리를 찾습니다.
 * 나중에 사용자 설정으로 확장 가능하도록 구조화되어 있습니다.
 */
export function getSalaryCategoryId(categories: Category[]): string | null {
  const salaryCategory = categories.find(
    (c) => c.kind === 'INCOME' && c.name === '급여'
  );
  return salaryCategory?.id || null;
}

/**
 * 급여 카테고리의 수입 거래들을 날짜순으로 정렬하여 반환합니다.
 */
export function getSalaryTransactions(
  transactions: Transaction[],
  salaryCategoryId: string
): Transaction[] {
  return transactions
    .filter(
      (t) => t.type === 'INCOME' && t.categoryId === salaryCategoryId
    )
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
}

/**
 * 급여 기반 잔액을 계산합니다.
 * 
 * 로직:
 * 1. 급여 거래들을 날짜순으로 정렬
 * 2. 각 급여에 대해 기간 계산:
 *    - 시작일: 급여일
 *    - 종료일: 다음 급여일 전날 (마지막 급여면 오늘까지)
 * 3. 각 기간의 지출 합산
 * 4. 총 급여 수입 - 총 지출 = 잔액
 * 
 * @param transactions 모든 거래 목록
 * @param salaryCategoryId 급여 카테고리 ID
 * @returns { totalSalary: 총 급여 수입, totalExpense: 총 지출, balance: 잔액 }
 */
export function calculateSalaryBasedBalance(
  transactions: Transaction[],
  salaryCategoryId: string
): {
  totalSalary: number;
  totalExpense: number;
  balance: number;
} {
  // 급여 거래 찾기 및 정렬
  const salaryTransactions = getSalaryTransactions(transactions, salaryCategoryId);

  if (salaryTransactions.length === 0) {
    return { totalSalary: 0, totalExpense: 0, balance: 0 };
  }

  // 총 급여 수입 계산
  const totalSalary = salaryTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 오늘 날짜
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 각 급여별로 기간 계산 및 지출 합산
  let totalExpense = 0;

  for (let i = 0; i < salaryTransactions.length; i++) {
    const salaryDate = parseISO(salaryTransactions[i].date);
    salaryDate.setHours(0, 0, 0, 0);

    // 종료일 결정: 다음 급여일 전날 또는 오늘
    let endDate: Date;
    if (i < salaryTransactions.length - 1) {
      // 다음 급여일이 있는 경우: 다음 급여일 전날까지
      const nextSalaryDate = parseISO(salaryTransactions[i + 1].date);
      nextSalaryDate.setHours(0, 0, 0, 0);
      endDate = subDays(nextSalaryDate, 1);
    } else {
      // 마지막 급여인 경우: 오늘까지
      endDate = today;
    }

    // 해당 기간의 지출 합산
    const periodExpenses = transactions
      .filter((t) => {
        if (t.type !== 'EXPENSE') return false;
        
        const txDate = parseISO(t.date);
        txDate.setHours(0, 0, 0, 0);

        // 급여일부터 종료일까지 (포함)
        return (
          (isAfter(txDate, salaryDate) || isSameDay(txDate, salaryDate)) &&
          (isBefore(txDate, endDate) || isSameDay(txDate, endDate))
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    totalExpense += periodExpenses;
  }

  const balance = totalSalary - totalExpense;

  return {
    totalSalary,
    totalExpense,
    balance,
  };
}

