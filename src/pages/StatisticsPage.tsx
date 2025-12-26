import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { PeriodNavigator } from '@/components/common/PeriodNavigator';
import { TransactionSummary } from '@/components/transactions/TransactionSummary';
import { CategoryPieChart } from '@/components/statistics/CategoryPieChart';
import { TrendChart } from '@/components/statistics/TrendChart';
import { usePeriodStats } from '@/hooks/usePeriodStats';
import { useTrendData } from '@/hooks/useTrendData';
import { getPeriodRange, getPreviousPeriod, getNextPeriod } from '@/lib/periodUtils';
import { formatCurrency } from '@/lib/formatters';
import { AlertCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PeriodMode } from '@/types';

export default function StatisticsPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const periodRange = useMemo(() => getPeriodRange(periodMode, currentDate), [periodMode, currentDate]);
  const stats = usePeriodStats(periodMode, currentDate);
  const trendData = useTrendData(periodMode, currentDate);

  const handlePrevious = () => {
    setCurrentDate(getPreviousPeriod(periodMode, currentDate));
  };

  const handleNext = () => {
    setCurrentDate(getNextPeriod(periodMode, currentDate));
  };

  const chartData = stats.byCategory.map((c) => ({
    name: c.categoryName,
    value: c.amount,
    color: c.color
  }));

  // Find top spending category
  const topCategory = stats.byCategory.length > 0
    ? stats.byCategory.reduce((max, cat) => cat.amount > max.amount ? cat : max, stats.byCategory[0])
    : null;

  // Get period text for insights (어제/지난주/지난달)
  const periodText = periodMode === 'day' ? '어제' : periodMode === 'week' ? '지난주' : '지난달';
  const currentPeriodText = periodMode === 'day' ? '오늘' : periodMode === 'week' ? '이번 주' : '이번 달';

  // Period insights
  const insights = useMemo(() => {
    const result = [];

    // High spending warning
    if (stats.totalExpense > stats.totalIncome) {
      result.push({
        type: 'warning',
        message: `${currentPeriodText} 지출이 수입보다 많습니다`,
        detail: `${formatCurrency(stats.totalExpense - stats.totalIncome)} 적자`
      });
    }

    // Expense increase
    if (stats.change.expenseChange > 20) {
      result.push({
        type: 'alert',
        message: `${periodText} 대비 지출이 크게 증가했습니다`,
        detail: `${stats.change.expenseChange.toFixed(1)}% 증가`
      });
    }

    // Expense decrease
    if (stats.change.expenseChange < -10) {
      result.push({
        type: 'success',
        message: `${periodText} 대비 지출이 감소했습니다`,
        detail: `${Math.abs(stats.change.expenseChange).toFixed(1)}% 절감`
      });
    }

    // Top category spending
    if (topCategory && topCategory.percentage > 40) {
      result.push({
        type: 'info',
        message: `${topCategory.categoryName}에서 가장 많이 지출했습니다`,
        detail: `전체의 ${topCategory.percentage.toFixed(1)}%`
      });
    }

    return result;
  }, [stats, topCategory, periodText, currentPeriodText]);

  // Dynamic trend chart title
  const trendChartTitle = periodMode === 'day'
    ? '최근 30일 수입/지출 추이'
    : periodMode === 'week'
    ? '최근 12주 수입/지출 추이'
    : '최근 6개월 수입/지출 추이';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">통계</h1>
        <PeriodNavigator
          label={periodRange.label}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      {/* Period Selector */}
      <PeriodSelector value={periodMode} onChange={setPeriodMode} />

      {/* Summary KPI Cards */}
      <TransactionSummary stats={stats} />

      {/* Period Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    insight.type === 'warning' && 'bg-red-50 dark:bg-red-900/20',
                    insight.type === 'alert' && 'bg-orange-50 dark:bg-orange-900/20',
                    insight.type === 'success' && 'bg-green-50 dark:bg-green-900/20',
                    insight.type === 'info' && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <AlertCircle className={cn(
                    'h-5 w-5 mt-0.5',
                    insight.type === 'warning' && 'text-red-600',
                    insight.type === 'alert' && 'text-orange-600',
                    insight.type === 'success' && 'text-green-600',
                    insight.type === 'info' && 'text-blue-600'
                  )} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{insight.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">{insight.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <TrendChart data={trendData} title={trendChartTitle} />

      {/* Category Pie Chart */}
      <CategoryPieChart data={chartData} title="카테고리별 지출" />

      {/* Category List */}
      {stats.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byCategory.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium">{cat.categoryName}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(cat.amount)}</div>
                    <div className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
