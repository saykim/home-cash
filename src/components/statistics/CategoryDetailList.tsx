import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color?: string;
  icon?: string;
}

interface CategoryDetailListProps {
  categories: CategoryStat[];
}

export function CategoryDetailList({ categories }: CategoryDetailListProps) {
  // Sort by amount descending
  const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">카테고리 내세일</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>카테고리별 지출 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {cat.icon && (
                    <span className="text-lg flex-shrink-0">{cat.icon}</span>
                  )}
                  {cat.color && !cat.icon && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  <span className="text-sm font-medium truncate">{cat.categoryName}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-semibold text-sm">
                    {formatCurrency(cat.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {cat.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
