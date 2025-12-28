import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Circular Progress Component
function CircularProgress({ percentage, size = 200, strokeWidth = 16 }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 100) return '#ef4444'; // red
    if (percentage >= 80) return '#f97316'; // orange
    return '#22c55e'; // green
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{percentage.toFixed(0)}%</span>
        <span className="text-sm text-muted-foreground">Used</span>
      </div>
    </div>
  );
}

// Category Icon Component (simple emoji-based)
function CategoryIcon({ icon, color }: { icon?: string; color?: string }) {
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
      style={{ backgroundColor: color ? `${color}20` : '#f3f4f6' }}
    >
      {icon || '📦'}
    </div>
  );
}

export default function BudgetPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');

  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets(monthStr);
  const { expenseCategories } = useCategories();
  const { transactions } = useTransactions(monthStr);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ id: string; categoryId: string; amount: number } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleSetBudget = async () => {
    if (!selectedCategoryId || !budgetAmount) {
      alert('카테고리와 예산을 입력해주세요.');
      return;
    }

    if (editingBudget) {
      await updateBudget(editingBudget.id, Number(budgetAmount));
    } else {
      await addBudget(selectedCategoryId, Number(budgetAmount), monthStr);
    }

    resetForm();
  };

  const resetForm = () => {
    setSelectedCategoryId('');
    setBudgetAmount('');
    setEditingBudget(null);
    setDialogOpen(false);
  };

  const handleEdit = (budgetId: string, categoryId: string, amount: number) => {
    setEditingBudget({ id: budgetId, categoryId, amount });
    setSelectedCategoryId(categoryId);
    setBudgetAmount(String(amount));
    setDialogOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (confirm('이 예산을 삭제하시겠습니까?')) {
      await deleteBudget(budgetId);
    }
  };

  // Calculate spending by category
  const spendingByCategory = useMemo(() => {
    const spending: Record<string, number> = {};

    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
      });

    return spending;
  }, [transactions]);

  // Combine budgets with spending
  const budgetStats = useMemo(() => {
    return expenseCategories.map((category) => {
      const budget = budgets.find((b) => b.categoryId === category.id);
      const spent = spendingByCategory[category.id] || 0;

      if (!budget) return null;

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;
      const isOverBudget = spent > budget.amount;
      const isWarning = percentage >= 80 && percentage < 100;

      return {
        budgetId: budget.id,
        category,
        budget: budget.amount,
        spent,
        remaining,
        percentage,
        isOverBudget,
        isWarning
      };
    }).filter(Boolean);
  }, [expenseCategories, budgets, spendingByCategory]);

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = Object.values(spendingByCategory).reduce((sum, s) => sum + s, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Categories without budget for adding
  const categoriesWithoutBudget = expenseCategories.filter(
    cat => !budgets.some(b => b.categoryId === cat.id)
  );

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center px-3 py-2 bg-muted rounded-lg">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Total Budget Overview */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg">Total Budget Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col items-center">
              {/* Circular Progress */}
              <CircularProgress percentage={totalPercentage} size={180} strokeWidth={14} />

              {/* Remaining Balance */}
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className={cn(
                  "text-3xl font-bold mt-1",
                  totalRemaining < 0 ? "text-red-600" : "text-foreground"
                )}>
                  {formatCurrency(Math.abs(totalRemaining))}
                </p>
                {totalRemaining < 0 && (
                  <p className="text-sm text-red-600">초과 지출</p>
                )}
              </div>

              {/* Total Budget / Used */}
              <div className="mt-6 pt-4 border-t w-full flex justify-around">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="w-px bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Used</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Category Budgets */}
        <Card className="p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Category Budgets</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              if (!open) resetForm();
              setDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={categoriesWithoutBudget.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBudget ? '예산 수정' : '예산 추가'}</DialogTitle>
                  <DialogDescription className="sr-only">
                    카테고리를 선택하고 월별 예산 금액을 입력해 저장합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">카테고리</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                      disabled={!!editingBudget}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {(editingBudget
                          ? expenseCategories.filter(cat => cat.id === editingBudget.categoryId)
                          : categoriesWithoutBudget
                        ).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">예산 금액</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={handleSetBudget} className="w-full">
                    {editingBudget ? '수정' : '추가'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0 space-y-4 max-h-[400px] overflow-y-auto">
            {budgetStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>설정된 예산이 없습니다</p>
                <p className="text-sm mt-1">카테고리별 예산을 추가하세요</p>
              </div>
            ) : (
              budgetStats.map((stat) => stat && (
                <div
                  key={stat.category.id}
                  className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <CategoryIcon icon={stat.category.icon} color={stat.category.color} />

                    {/* Category Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{stat.category.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold",
                            stat.isOverBudget ? "text-red-600" :
                            stat.isWarning ? "text-orange-500" : "text-green-600"
                          )}>
                            {stat.percentage.toFixed(0)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(stat.budgetId, stat.category.id, stat.budget)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => handleDelete(stat.budgetId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            stat.isOverBudget ? "bg-red-500" :
                            stat.isWarning ? "bg-orange-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                        />
                      </div>

                      {/* Amount Info */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className={cn(
                          "font-semibold",
                          stat.isOverBudget ? "text-red-600" : "text-foreground"
                        )}>
                          {formatCurrency(stat.spent)}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(stat.budget)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
