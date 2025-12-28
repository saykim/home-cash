import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCardPerformance } from '@/hooks/useCardPerformance';
import { formatCurrency } from '@/lib/formatters';
import { format, subMonths, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, Target, Gift, CreditCard as CreditCardIcon } from 'lucide-react';

export default function CherryPickerPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');

  const { performances, totalBillingAmount, totalTransactions } = useCardPerformance(monthStr);

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">체리피커 대시보드</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 결제 예정</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(totalBillingAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTransactions}건의 거래
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">등록 카드</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{performances.length}장</div>
            <p className="text-xs text-muted-foreground mt-1">
              {performances.filter((p) => p.achievedTiers.length > 0).length}장 혜택 달성
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card Performance */}
      {performances.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <CreditCardIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>등록된 카드가 없습니다</p>
            <p className="text-sm mt-2">카드 페이지에서 카드를 추가하세요</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {performances.map((perf) => {
            const progressPercent = perf.nextTier
              ? Math.min((perf.currentMonthSpend / perf.nextTier.threshold) * 100, 100)
              : 100;

            return (
              <Card key={perf.cardId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{perf.cardName}</CardTitle>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(perf.currentMonthSpend)}</p>
                      <p className="text-xs text-muted-foreground">{perf.currentMonthTransactions}건</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Next Billing */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">다음 결제일</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{format(new Date(perf.nextBillingDate), 'M월 d일', { locale: ko })}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(perf.billingAmount)}</p>
                    </div>
                  </div>

                  {/* Achieved Tiers */}
                  {perf.achievedTiers.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <Gift className="h-4 w-4" />
                        <span>달성한 혜택</span>
                      </div>
                      <div className="space-y-1">
                        {perf.achievedTiers.map((tier) => (
                          <div key={tier.id} className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-900/20">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                            <span className="text-sm">{tier.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Tier Progress */}
                  {perf.nextTier && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">다음 혜택까지</span>
                        <span className="text-primary font-semibold">
                          {formatCurrency(perf.remainingForNextTier)} 남음
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {perf.nextTier.description} ({formatCurrency(perf.nextTier.threshold)} 이상)
                      </p>
                    </div>
                  )}

                  {perf.nextTier === null && perf.achievedTiers.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        🎉 모든 혜택 달성 완료!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
