import { X, Filter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryIds: Set<string>;
  onToggle: (categoryId: string) => void;
  onClear: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategoryIds,
  onToggle,
  onClear
}: CategoryFilterProps) {
  const expenseCategories = categories.filter((c) => c.kind === 'EXPENSE');

  if (expenseCategories.length === 0) {
    return null;
  }

  const hasActiveFilters = selectedCategoryIds.size > 0;

  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 rounded-2xl blur-xl" />

      <div className="relative bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-900/40 dark:to-gray-900/20 backdrop-blur-sm rounded-2xl p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] border border-white/20 dark:border-gray-800/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg blur opacity-30" />
              <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-300/30 dark:border-pink-700/30 shadow-inner">
                <Filter className="h-3.5 w-3.5 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 drop-shadow-sm">
              카테고리 필터
              {hasActiveFilters && (
                <span className="ml-1.5 text-pink-600 dark:text-pink-400 font-medium">
                  ({selectedCategoryIds.size})
                </span>
              )}
            </h3>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-6 px-2 text-[10px] font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50/50 dark:text-pink-400 dark:hover:bg-pink-950/20 transition-all backdrop-blur-sm"
            >
              <X className="h-3 w-3 mr-0.5" />
              초기화
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {expenseCategories.map((category) => {
            const isSelected = selectedCategoryIds.has(category.id);
            const categoryColor = category.color || '#ec4899';

            return (
              <button
                key={category.id}
                onClick={() => onToggle(category.id)}
                className={cn(
                  'group relative px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200',
                  'hover:scale-105 active:scale-95 hover:-translate-y-0.5',
                  'focus:outline-none focus:ring-1 focus:ring-pink-400/50 focus:ring-offset-1',
                  isSelected
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/40'
                    : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300/50 dark:hover:border-pink-700/50 hover:shadow-md shadow-sm'
                )}
                style={
                  isSelected && category.color
                    ? {
                        background: `linear-gradient(135deg, ${categoryColor}ee, ${categoryColor})`,
                        boxShadow: `0 4px 12px -2px ${categoryColor}40`
                      }
                    : undefined
                }
              >
                <span className="relative z-10 drop-shadow-sm">{category.name}</span>
                {isSelected && (
                  <X className="ml-1 h-2.5 w-2.5 inline drop-shadow" />
                )}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/0 via-transparent to-purple-500/0 group-hover:from-pink-500/10 group-hover:to-purple-500/10 transition-all duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
