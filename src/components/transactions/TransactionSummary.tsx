import { KpiCard } from '@/components/common/KpiCard';
import type { PeriodStats } from '@/types';

interface TransactionSummaryProps {
  stats: PeriodStats;
}

export function TransactionSummary({ stats }: TransactionSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        title="총 수입"
        amount={stats.totalIncome}
        changeRate={stats.change.incomeChange}
        variant="income"
      />
      <KpiCard
        title="총 지출"
        amount={stats.totalExpense}
        changeRate={stats.change.expenseChange}
        variant="expense"
      />
      <KpiCard
        title="순 수입"
        amount={stats.netAmount}
        changeRate={stats.change.netChange}
        variant="net"
      />
    </div>
  );
}
