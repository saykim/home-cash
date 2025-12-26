import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  amount: number;
  changeRate?: number;
  variant?: 'income' | 'expense' | 'net';
}

export function KpiCard({ title, amount, changeRate, variant = 'net' }: KpiCardProps) {
  const colorClass = variant === 'income'
    ? 'text-green-600 dark:text-green-400'
    : variant === 'expense'
    ? 'text-red-600 dark:text-red-400'
    : amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  // 지출은 감소가 긍정적, 수입과 순수익은 증가가 긍정적
  const showChangeAsPositive = variant === 'expense' ? (changeRate ?? 0) < 0 : (changeRate ?? 0) > 0;

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className={cn('text-2xl font-bold tabular-nums', colorClass)}>
            {formatCurrency(amount)}
          </div>
          {changeRate !== undefined && changeRate !== 0 && (
            <div className={cn(
              'flex items-center text-sm font-medium',
              showChangeAsPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {showChangeAsPositive ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(changeRate).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
