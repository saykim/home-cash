import { useMemo } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters";
import type { Budget, Transaction, Category } from "@/types";

interface BudgetStatusProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  currentMonth: Date;
}

/**
 * Budget Status Component for Calendar Sidebar
 * Shows monthly budget progress for each category
 */
export function BudgetStatus({
  budgets,
  transactions,
  categories,
  currentMonth,
}: BudgetStatusProps) {
  const monthStr = format(currentMonth, "yyyy-MM");

  const budgetData = useMemo(() => {
    // Filter budgets for current month
    const monthBudgets = budgets.filter((b) => b.month === monthStr);

    // Calculate spending by category for current month
    const spending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "EXPENSE" && t.date.startsWith(monthStr))
      .forEach((t) => {
        spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
      });

    // Combine budgets with spending
    const items = monthBudgets
      .map((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        if (!category) return null;

        const spent = spending[budget.categoryId] || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          budgetId: budget.id,
          category,
          budget: budget.amount,
          spent,
          percentage,
          remaining: budget.amount - spent,
        };
      })
      .filter(Boolean);

    // Calculate totals
    const totalBudget = monthBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = Object.values(spending).reduce((sum, s) => sum + s, 0);
    const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      items,
      totalBudget,
      totalSpent,
      totalPercentage,
    };
  }, [budgets, transactions, categories, monthStr]);

  if (budgetData.items.length === 0) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">예산 현황</h3>
          <p className="text-sm text-muted-foreground text-center py-4">
            이번 달 설정된 예산이 없습니다
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">예산 현황</h3>

        {/* Category budgets */}
        <div className="space-y-3">
          {budgetData.items.map((item) => (
            <div key={item!.budgetId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-1">
                  <span>{item!.category.icon}</span>
                  <span>{item!.category.name}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {formatCurrency(item!.spent)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    / {formatCurrency(item!.budget)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min(item!.percentage, 100)}
                  className="flex-1 h-2"
                />
                <span className="text-xs font-medium tabular-nums w-12 text-right text-muted-foreground">
                  {item!.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total budget */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">전체 예산 대비</span>
            <span className="font-semibold">
              {formatCurrency(budgetData.totalSpent)}
              <span className="text-muted-foreground text-xs ml-1">
                / {formatCurrency(budgetData.totalBudget)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
