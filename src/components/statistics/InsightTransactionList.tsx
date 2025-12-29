import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useCategories } from '@/hooks/useCategories';
import type { Transaction } from '@/types';

interface InsightTransactionListProps {
  transactions: Transaction[];
  insightType: 'warning' | 'alert' | 'info';
  onClose: () => void;
}

export function InsightTransactionList({ transactions, insightType, onClose }: InsightTransactionListProps) {
  const { allCategories } = useCategories();

  const title = insightType === 'info' ? '카테고리별 거래 내역' : '지출 내역';

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>거래 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {transactions.map((tx) => {
              const category = allCategories.find(c => c.id === tx.categoryId);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tx.date}</span>
                      {category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {category.icon} {category.name}
                        </span>
                      )}
                    </div>
                    {tx.memo && (
                      <div className="text-xs text-muted-foreground mt-1">{tx.memo}</div>
                    )}
                  </div>
                  <div className="font-semibold text-red-600 ml-4">
                    -{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 {transactions.length}건</span>
          <span className="font-semibold text-red-600">
            -{formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
