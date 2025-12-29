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
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700'
  },
  alert: {
    container: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-900',
    description: 'text-orange-700'
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700'
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
