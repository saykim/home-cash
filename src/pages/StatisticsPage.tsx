import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CategoryPieChart } from '@/components/statistics/CategoryPieChart';
import { TrendChart } from '@/components/statistics/TrendChart';
import { InsightCard } from '@/components/statistics/InsightCard';
import { CategoryDetailList } from '@/components/statistics/CategoryDetailList';
import { usePeriodStats } from '@/hooks/usePeriodStats';
import { useLast6MonthsTrend } from '@/hooks/useLast6MonthsTrend';
import { formatCurrency } from '@/lib/formatters';

export default function StatisticsPage() {
  // Fixed to current month for statistics calculation
  const currentDate = new Date();
  const stats = usePeriodStats('month', currentDate);
  const trendData = useLast6MonthsTrend();

  const chartData = stats.byCategory.map((c) => ({
    name: c.categoryName,
    value: c.amount,
    color: c.color
  }));

  // Find top spending category
  const topCategory = stats.byCategory.length > 0
    ? stats.byCategory.reduce((max, cat) => cat.amount > max.amount ? cat : max, stats.byCategory[0])
    : null;

  // Period insights
  const insights = useMemo(() => {
    const result: Array<{
      type: 'warning' | 'alert' | 'info';
      title: string;
      description: string;
      amount?: number;
      percentage?: number;
    }> = [];

    // High spending warning
    if (stats.totalExpense > stats.totalIncome) {
      result.push({
        type: 'warning',
        title: '이번 달 지출이 수입보다 많습니다',
        description: `${formatCurrency(stats.totalExpense - stats.totalIncome)} 적자`,
        amount: stats.totalExpense - stats.totalIncome
      });
    }

    // Expense increase
    if (stats.change.expenseChange > 20) {
      result.push({
        type: 'alert',
        title: '지난달 대비 지출이 크게 증가했습니다',
        description: '지난 달에 크게 증가',
        percentage: stats.change.expenseChange
      });
    }

    // Top category spending
    if (topCategory && topCategory.percentage > 40) {
      result.push({
        type: 'info',
        title: `${topCategory.categoryName}에서 가장 많이 지출했습니다`,
        description: `${topCategory.categoryName}에서 지출했습니다`,
        percentage: topCategory.percentage
      });
    }

    return result;
  }, [stats, topCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">인사이트</h1>
      </div>

      {/* Insights Section - 3 cards in a row */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </div>
      )}

      {/* Main Statistics Section - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Trend Chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">최근 6개월 수입/지출 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trendData} title="" />
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={chartData} title="" />
          </CardContent>
        </Card>

        {/* Category Detail List */}
        <CategoryDetailList categories={stats.byCategory} />
      </div>
    </div>
  );
}
