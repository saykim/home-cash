import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { PeriodNavigator } from '@/components/common/PeriodNavigator';
import { CategoryPieChart } from '@/components/statistics/CategoryPieChart';
import { TrendChart } from '@/components/statistics/TrendChart';
import { InsightCard } from '@/components/statistics/InsightCard';
import { CategoryDetailList } from '@/components/statistics/CategoryDetailList';
import { InsightTransactionList } from '@/components/statistics/InsightTransactionList';
import { usePeriodStats } from '@/hooks/usePeriodStats';
import { useTrendData } from '@/hooks/useTrendData';
import { getPeriodRange, getPreviousPeriod, getNextPeriod } from '@/lib/periodUtils';
import { formatCurrency } from '@/lib/formatters';
import type { PeriodMode } from '@/types';

export default function StatisticsPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInsightIndex, setSelectedInsightIndex] = useState<number | null>(null);

  const periodRange = useMemo(() => getPeriodRange(periodMode, currentDate), [periodMode, currentDate]);
  const stats = usePeriodStats(periodMode, currentDate);
  const trendData = useTrendData(periodMode, currentDate);

  const handlePrevious = () => {
    setCurrentDate(getPreviousPeriod(periodMode, currentDate));
    setSelectedInsightIndex(null); // Reset selection when period changes
  };

  const handleNext = () => {
    setCurrentDate(getNextPeriod(periodMode, currentDate));
    setSelectedInsightIndex(null); // Reset selection when period changes
  };

  const handleInsightClick = (index: number) => {
    setSelectedInsightIndex(selectedInsightIndex === index ? null : index);
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

  // Get period text for insights
  const periodText = periodMode === 'day' ? '어제' : periodMode === 'week' ? '지난주' : '지난달';
  const currentPeriodText = periodMode === 'day' ? '오늘' : periodMode === 'week' ? '이번 주' : '이번 달';

  // Period insights with filter metadata
  const insights = useMemo(() => {
    const result: Array<{
      type: 'warning' | 'alert' | 'info';
      title: string;
      description: string;
      amount?: number;
      percentage?: number;
      filterType: 'allExpense' | 'category';
      categoryId?: string;
    }> = [];

    // High spending warning
    if (stats.totalExpense > stats.totalIncome) {
      result.push({
        type: 'warning',
        title: `${currentPeriodText} 지출이 수입보다 많습니다`,
        description: `${formatCurrency(stats.totalExpense - stats.totalIncome)} 적자`,
        amount: stats.totalExpense - stats.totalIncome,
        filterType: 'allExpense'
      });
    }

    // Expense increase
    if (stats.change.expenseChange > 20) {
      result.push({
        type: 'alert',
        title: `${periodText} 대비 지출이 크게 증가했습니다`,
        description: `${periodText} 대비 크게 증가`,
        percentage: stats.change.expenseChange,
        filterType: 'allExpense'
      });
    }

    // Top category spending
    if (topCategory && topCategory.percentage > 40) {
      result.push({
        type: 'info',
        title: `${topCategory.categoryName}에서 가장 많이 지출했습니다`,
        description: `${topCategory.categoryName}에서 지출했습니다`,
        percentage: topCategory.percentage,
        filterType: 'category',
        categoryId: topCategory.categoryId
      });
    }

    return result;
  }, [stats, topCategory, periodText, currentPeriodText]);

  // Filter transactions based on selected insight
  const filteredTransactions = useMemo(() => {
    if (selectedInsightIndex === null || !insights[selectedInsightIndex]) {
      return [];
    }

    const insight = insights[selectedInsightIndex];
    const currentTransactions = stats.currentTransactions || [];

    if (insight.filterType === 'allExpense') {
      // Show all expense transactions
      return currentTransactions
        .filter(tx => tx.type === 'EXPENSE')
        .sort((a, b) => b.date.localeCompare(a.date));
    } else if (insight.filterType === 'category' && insight.categoryId) {
      // Show only expenses for specific category
      return currentTransactions
        .filter(tx => tx.type === 'EXPENSE' && tx.categoryId === insight.categoryId)
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    return [];
  }, [selectedInsightIndex, insights, stats.currentTransactions]);

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

      {/* Insights Section - 3 cards in a row */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <InsightCard
              key={index}
              {...insight}
              onClick={() => handleInsightClick(index)}
              isSelected={selectedInsightIndex === index}
            />
          ))}
        </div>
      )}

      {/* Selected Insight Transaction List */}
      {selectedInsightIndex !== null && filteredTransactions.length > 0 && (
        <InsightTransactionList
          transactions={filteredTransactions}
          insightType={insights[selectedInsightIndex].type}
          onClose={() => setSelectedInsightIndex(null)}
        />
      )}

      {/* Main Statistics Section - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">{trendChartTitle}</CardTitle>
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
