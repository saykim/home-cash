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
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BudgetPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');

  const { budgets, addBudget } = useBudgets(monthStr);
  const { expenseCategories } = useCategories();
  const { transactions } = useTransactions(monthStr);

  const [dialogOpen, setDialogOpen] = useState(false);
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

    await addBudget(selectedCategoryId, Number(budgetAmount), monthStr);
    setSelectedCategoryId('');
    setBudgetAmount('');
    setDialogOpen(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">예산 관리</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>전체 예산</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">총 예산</span>
              <span className="font-bold text-lg">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">사용 금액</span>
              <span className={cn(
                'font-bold text-lg',
                totalSpent > totalBudget ? 'text-red-600' : 'text-blue-600'
              )}>
                {formatCurrency(totalSpent)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">남은 금액</span>
              <span className={cn(
                'font-bold text-lg',
                totalRemaining < 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {formatCurrency(totalRemaining)}
              </span>
            </div>

            {totalBudget > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>사용률</span>
                  <span className={cn(
                    'font-semibold',
                    totalPercentage > 100 ? 'text-red-600' : totalPercentage >= 80 ? 'text-orange-600' : 'text-green-600'
                  )}>
                    {totalPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className={cn(
                      'h-3 rounded-full transition-all',
                      totalPercentage > 100 ? 'bg-red-600' : totalPercentage >= 80 ? 'bg-orange-500' : 'bg-green-600'
                    )}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Budget Button */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            카테고리별 예산 설정
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>예산 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
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
              설정
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budget List */}
      {budgetStats.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>설정된 예산이 없습니다</p>
            <p className="text-sm mt-2">카테고리별 예산을 설정하여 지출을 관리하세요</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgetStats.map((stat) => stat && (
            <Card key={stat.category.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.category.color }} />
                      <span className="font-semibold">{stat.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stat.isOverBudget && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      {stat.isWarning && !stat.isOverBudget && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                      {!stat.isOverBudget && !stat.isWarning && stat.percentage > 0 && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">예산</p>
                      <p className="font-semibold">{formatCurrency(stat.budget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">사용</p>
                      <p className={cn(
                        'font-semibold',
                        stat.isOverBudget ? 'text-red-600' : 'text-blue-600'
                      )}>
                        {formatCurrency(stat.spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">남음</p>
                      <p className={cn(
                        'font-semibold',
                        stat.remaining < 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {formatCurrency(stat.remaining)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{stat.percentage.toFixed(1)}% 사용</span>
                      {stat.isOverBudget && (
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(Math.abs(stat.remaining))} 초과
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          stat.isOverBudget ? 'bg-red-600' : stat.isWarning ? 'bg-orange-500' : 'bg-green-600'
                        )}
                        style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
