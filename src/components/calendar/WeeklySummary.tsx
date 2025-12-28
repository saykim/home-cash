import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { Transaction, Category } from "@/types";

interface WeeklySummaryProps {
  transactions: Transaction[];
  categories: Category[];
}

/**
 * Weekly Summary Component
 * Displays this week's expense summary with category breakdown
 */
export function WeeklySummary({ transactions, categories }: WeeklySummaryProps) {
  const weekData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Start on Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

    // Filter this week's transactions
    const weekTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return isWithinInterval(txDate, { start: weekStart, end: weekEnd });
    });

    // Calculate weekly expense and income
    const weekExpense = weekTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const weekIncome = weekTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate category expenses
    const categoryExpenses = new Map<string, number>();
    weekTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const current = categoryExpenses.get(t.categoryId) || 0;
        categoryExpenses.set(t.categoryId, current + t.amount);
      });

    // Get top 5 categories
    const topCategories = Array.from(categoryExpenses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([categoryId, amount]) => ({
        category: categories.find((c) => c.id === categoryId)!,
        amount,
        percentage: weekExpense > 0 ? (amount / weekExpense) * 100 : 0,
      }))
      .filter(({ category }) => category); // Filter out undefined categories

    // Daily average
    const dailyAverage = weekExpense / 7;

    return {
      weekStart,
      weekEnd,
      transactions: weekTransactions,
      expense: weekExpense,
      income: weekIncome,
      dailyAverage,
      topCategories,
      netAmount: weekIncome - weekExpense,
    };
  }, [transactions, categories]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-lg font-bold">이번주 지출요약</h2>
        <p className="text-xs text-muted-foreground">
          {format(weekData.weekStart, "M월 d일", { locale: ko })} -{" "}
          {format(weekData.weekEnd, "M월 d일", { locale: ko })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Totals */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs text-red-700 dark:text-red-400">지출</span>
            </div>
            <p className="text-sm font-bold text-red-600">
              {formatCurrency(weekData.expense)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400">수입</span>
            </div>
            <p className="text-sm font-bold text-green-600">
              {formatCurrency(weekData.income)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-blue-700 dark:text-blue-400">일평균</span>
            </div>
            <p className="text-sm font-bold text-blue-600">
              {formatCurrency(weekData.dailyAverage)}
            </p>
          </div>
        </div>

        {/* Net Amount (if significant) */}
        {Math.abs(weekData.netAmount) > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
            <span className="text-sm font-medium">순 지출</span>
            <span
              className={`text-sm font-bold ${
                weekData.netAmount > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {weekData.netAmount > 0 ? "+" : ""}
              {formatCurrency(weekData.netAmount)}
            </span>
          </div>
        )}

        {/* Top Categories */}
        {weekData.topCategories.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold mb-2">주요 지출</h3>
            <div className="space-y-2.5">
              {weekData.topCategories.map(({ category, amount, percentage }) => (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                      <span className="text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              이번 주 지출 내역이 없습니다
            </p>
          </div>
        )}

        {/* Weekly Stats Summary */}
        {weekData.transactions.length > 0 && (
          <div className="pt-3 border-t space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">총 거래</span>
              <span className="font-medium">{weekData.transactions.length}건</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">일평균 거래</span>
              <span className="font-medium">
                {(weekData.transactions.length / 7).toFixed(1)}건
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
