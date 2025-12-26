import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { Transaction, Budget, Category } from '@/types';

interface BudgetProgressProps {
  transactions: Transaction[];
  budgets: Budget[];
  allCategories: Category[];
}

export function BudgetProgress({ transactions, budgets, allCategories }: BudgetProgressProps) {
  // Calculate spending by category
  const categorySpending = useMemo(() => {
    const spending = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.type === 'EXPENSE') {
        const current = spending.get(tx.categoryId) || 0;
        spending.set(tx.categoryId, current + tx.amount);
      }
    });

    return spending;
  }, [transactions]);

  // Filter budgets that have spending or budget amount
  const activeBudgets = useMemo(() => {
    return budgets
      .map((budget) => {
        const category = allCategories.find((c) => c.id === budget.categoryId);
        const spent = categorySpending.get(budget.categoryId) || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
          budget,
          category,
          spent,
          percentage
        };
      })
      .filter((item) => item.category && (item.spent > 0 || item.budget.amount > 0))
      .sort((a, b) => b.percentage - a.percentage); // Sort by highest percentage first
  }, [budgets, categorySpending, allCategories]);

  if (activeBudgets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">예산 현황</h3>
      <div className="space-y-3">
        {activeBudgets.map(({ budget, category, spent, percentage }) => {
          const isOverBudget = percentage > 100;
          const isNearLimit = percentage > 80 && percentage <= 100;

          return (
            <div key={budget.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{category!.name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-semibold',
                    isOverBudget && 'text-red-600',
                    isNearLimit && 'text-orange-600'
                  )}>
                    {formatCurrency(spent)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    / {formatCurrency(budget.amount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Progress
                  value={Math.min(percentage, 100)}
                  className={cn(
                    'flex-1',
                    isOverBudget && '[&>div]:bg-red-600',
                    isNearLimit && '[&>div]:bg-orange-500'
                  )}
                />
                <span className={cn(
                  'text-xs font-medium tabular-nums w-12 text-right',
                  isOverBudget && 'text-red-600',
                  isNearLimit && 'text-orange-600',
                  !isOverBudget && !isNearLimit && 'text-muted-foreground'
                )}>
                  {percentage.toFixed(0)}%
                </span>
              </div>

              {isOverBudget && (
                <p className="text-xs text-red-600 mt-1">
                  예산 초과: {formatCurrency(spent - budget.amount)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            전체 예산 대비
          </span>
          <span className={cn(
            'font-semibold',
            activeBudgets.some(b => b.percentage > 100) && 'text-red-600'
          )}>
            {formatCurrency(activeBudgets.reduce((sum, b) => sum + b.spent, 0))}
            <span className="text-muted-foreground text-xs ml-1">
              / {formatCurrency(activeBudgets.reduce((sum, b) => sum + b.budget.amount, 0))}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
