import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type KpiVariant = 'hero' | 'income' | 'expense' | 'net-positive' | 'net-negative';

interface DashboardKpiCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant: KpiVariant;
  subtitle?: string;
  className?: string;
}

const variantStyles: Record<KpiVariant, {
  card: string;
  label: string;
  icon: string;
  amount: string;
}> = {
  hero: {
    card: 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0 shadow-xl',
    label: 'text-slate-300',
    icon: 'text-slate-400',
    amount: 'text-white',
  },
  income: {
    card: 'border border-income/20 bg-income/5 dark:bg-income/10',
    label: 'text-income',
    icon: 'text-income',
    amount: 'text-income',
  },
  expense: {
    card: 'border border-expense/20 bg-expense/5 dark:bg-expense/10',
    label: 'text-expense',
    icon: 'text-expense',
    amount: 'text-expense',
  },
  'net-positive': {
    card: 'border border-transfer/20 bg-transfer/5 dark:bg-transfer/10',
    label: 'text-transfer',
    icon: 'text-transfer',
    amount: 'text-transfer',
  },
  'net-negative': {
    card: 'border border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20',
    label: 'text-orange-700 dark:text-orange-400',
    icon: 'text-orange-600 dark:text-orange-400',
    amount: 'text-orange-700 dark:text-orange-400',
  },
};

export function DashboardKpiCard({
  title,
  amount,
  icon: Icon,
  variant,
  subtitle,
  className,
}: DashboardKpiCardProps) {
  const styles = variantStyles[variant];
  const isHero = variant === 'hero';

  return (
    <Card className={cn(styles.card, 'h-full', className)}>
      <CardContent className={isHero ? 'p-4' : 'p-3'}>
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn(
            'font-medium uppercase tracking-wider',
            isHero ? 'text-[10px]' : 'text-[10px]',
            styles.label
          )}>
            {title}
          </span>
          <Icon className={cn(isHero ? 'h-4 w-4' : 'h-3.5 w-3.5', styles.icon)} />
        </div>
        <div className={cn(
          'font-bold tabular-nums tracking-tight',
          isHero ? 'text-3xl mb-0.5' : 'text-xl',
          styles.amount
        )}>
          {formatCurrency(amount)}
        </div>
        {subtitle && (
          <div className={cn(
            'text-xs',
            isHero ? 'text-slate-400' : 'text-muted-foreground'
          )}>
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
