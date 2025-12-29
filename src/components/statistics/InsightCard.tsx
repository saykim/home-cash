import { AlertCircle, TrendingUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface InsightCardProps {
  type: 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  amount?: number;
  percentage?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

const iconMap = {
  warning: AlertCircle,
  alert: TrendingUp,
  info: Info
};

const styleMap = {
  warning: {
    container: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-200',
    description: 'text-red-700 dark:text-red-300'
  },
  alert: {
    container: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
    icon: 'text-orange-600 dark:text-orange-400',
    title: 'text-orange-900 dark:text-orange-200',
    description: 'text-orange-700 dark:text-orange-300'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-200',
    description: 'text-blue-700 dark:text-blue-300'
  }
};

export function InsightCard({ type, title, description, amount, percentage, onClick, isSelected }: InsightCardProps) {
  const Icon = iconMap[type];
  const styles = styleMap[type];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border transition-all',
        styles.container,
        onClick && 'cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-offset-2',
        isSelected && type === 'warning' && 'ring-red-400',
        isSelected && type === 'alert' && 'ring-orange-400',
        isSelected && type === 'info' && 'ring-blue-400'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5', styles.icon)} />
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-sm mb-1', styles.title)}>
            {title}
          </h3>
          <p className={cn('text-xs', styles.description)}>
            {description}
          </p>
          {(amount !== undefined || percentage !== undefined) && (
            <div className={cn('mt-2 text-sm font-semibold', styles.title)}>
              {amount !== undefined && formatCurrency(amount)}
              {percentage !== undefined && ` ${percentage.toFixed(1)}% 증가`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
