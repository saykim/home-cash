import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface RangeStatsProps {
  stats: {
    start: Date;
    end: Date;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    categories: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
    }>;
  };
  onClear: () => void;
}

export function RangeStats({ stats, onClear }: RangeStatsProps) {
  const { start, end, totalIncome, totalExpense, netAmount, transactionCount, categories } = stats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">기간 통계</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{format(start, 'M/d', { locale: ko })}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{format(end, 'M/d', { locale: ko })}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} className="h-7 px-2">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
          <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
            <TrendingUp className="h-3 w-3" />
            <span>수입</span>
          </div>
          <p className="text-sm font-bold text-green-700 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200">
          <div className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400 mb-1">
            <TrendingDown className="h-3 w-3" />
            <span>지출</span>
          </div>
          <p className="text-sm font-bold text-red-700 dark:text-red-400">
            {formatCurrency(totalExpense)}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
          <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">
            순액
          </div>
          <p className={cn(
            'text-sm font-bold',
            netAmount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
          )}>
            {formatCurrency(netAmount)}
          </p>
        </div>
      </div>

      {/* Transaction Count */}
      <div className="text-xs text-muted-foreground">
        총 {transactionCount}건의 거래
      </div>

      {/* Category Breakdown */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold">카테고리별 지출</h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate flex-1">
                  {cat.categoryName}
                </span>
                <span className="font-semibold ml-2">
                  {formatCurrency(cat.amount)}
                </span>
              </div>
            ))}
            {categories.length > 5 && (
              <p className="text-xs text-muted-foreground pt-1">
                외 {categories.length - 5}개 카테고리
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
