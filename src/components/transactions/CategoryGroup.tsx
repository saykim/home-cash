import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/types';

interface CategoryGroupProps {
  categoryName: string;
  categoryColor?: string;
  transactions: Transaction[];
  totalAmount: number;
  getAssetName: (assetId: string) => string;
  onDelete: (id: string) => void;
  defaultExpanded?: boolean;
  onSelect?: (tx: Transaction) => void;
}

export function CategoryGroup({
  categoryName,
  categoryColor = '#64748b',
  transactions,
  totalAmount,
  getAssetName,
  onDelete,
  defaultExpanded = true,
  onSelect
}: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 카테고리 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColor }}
          />
          <span className="font-semibold text-base">{categoryName}</span>
          <span className="text-sm text-muted-foreground">
            ({transactions.length}건)
          </span>
        </div>
        <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
          {formatCurrency(totalAmount)}
        </span>
      </button>

      {/* 거래 목록 */}
      {isExpanded && (
        <div className="divide-y">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="px-5 py-4 flex items-center justify-between group hover:bg-muted/30 transition-colors"
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(tx)}
              onKeyDown={(event) => {
                if (!onSelect) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(tx);
                }
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-base">{tx.memo || categoryName}</p>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      tx.type === 'INCOME'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : tx.type === 'EXPENSE'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    )}
                  >
                    {tx.type === 'INCOME' ? '수입' : tx.type === 'EXPENSE' ? '지출' : '이체'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {format(new Date(tx.date), 'yyyy.MM.dd')}
                  </p>
                  <span className="text-muted-foreground">·</span>
                  <p className="text-sm text-muted-foreground">
                    {getAssetName(tx.assetId)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p
                  className={cn(
                    'font-bold text-lg tabular-nums',
                    tx.type === 'INCOME'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(tx.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
