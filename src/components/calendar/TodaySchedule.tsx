import { useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, CreditCard, TrendingDown, PartyPopper } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { getEventTypeLabel } from "@/lib/eventUtils";
import { CalendarBadge, getCardColor } from "./CalendarBadge";
import type { Transaction, Category, CreditCard as CreditCardType, AnnualEvent } from "@/types";

interface TodayScheduleProps {
  transactions: Transaction[];
  categories: Category[];
  creditCards: CreditCardType[];
  annualEvents: AnnualEvent[];
}

/**
 * Today's Schedule Component
 * Displays today's events, card billing reminders, and expense summary
 */
export function TodaySchedule({
  transactions,
  categories,
  creditCards,
  annualEvents,
}: TodayScheduleProps) {
  const todayData = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const dayOfMonth = today.getDate();
    const monthOfYear = today.getMonth() + 1;

    // Filter today's transactions
    const todayTransactions = transactions.filter((t) => t.date === todayStr);

    // Filter today's annual events
    const todayEvents = annualEvents.filter(
      (e) => e.month === monthOfYear && e.day === dayOfMonth
    );

    // Filter cards with billing day today
    const todayBillingCards = creditCards.filter((c) => c.billingDay === dayOfMonth);

    // Calculate today's expense
    const todayExpense = todayTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const todayIncome = todayTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    // Get top 3 expense categories
    const categoryExpenses = new Map<string, number>();
    todayTransactions
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        const current = categoryExpenses.get(t.categoryId) || 0;
        categoryExpenses.set(t.categoryId, current + t.amount);
      });

    const topCategories = Array.from(categoryExpenses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([categoryId, amount]) => ({
        category: categories.find((c) => c.id === categoryId)!,
        amount,
      }))
      .filter(({ category }) => category); // Filter out undefined categories

    const isNoSpendDay = todayTransactions.length > 0 && todayExpense === 0;

    return {
      transactions: todayTransactions,
      events: todayEvents,
      billingCards: todayBillingCards,
      expense: todayExpense,
      income: todayIncome,
      topCategories,
      isNoSpendDay,
    };
  }, [transactions, annualEvents, creditCards, categories]);

  const today = new Date();

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {format(today, "M월 d일 (E)", { locale: ko })}
          </h2>
          {todayData.isNoSpendDay && (
            <CalendarBadge variant="income" className="font-semibold">
              No-Spend Day
            </CalendarBadge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">오늘의 일정</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Annual Events */}
        {todayData.events.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-pink-500" />
              이벤트
            </h3>
            <div className="space-y-1.5">
              {todayData.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-pink-50 dark:bg-pink-900/20"
                >
                  <div className="flex items-center gap-2">
                    <CalendarBadge variant="event">
                      {getEventTypeLabel(event.type).slice(0, 2)}
                    </CalendarBadge>
                    <span className="text-sm font-medium">{event.name}</span>
                  </div>
                  {event.targetYear && (
                    <span className="text-xs text-muted-foreground">
                      {new Date().getFullYear() - event.targetYear}주년
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card Billing Reminders */}
        {todayData.billingCards.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-500" />
              결제일
            </h3>
            <div className="space-y-1.5">
              {todayData.billingCards.map((card) => {
                // Calculate this month's card usage
                const monthStart = format(today, "yyyy-MM-01");
                const monthEnd = format(today, "yyyy-MM-dd");
                const cardUsage = transactions
                  .filter(
                    (t) =>
                      t.type === "EXPENSE" &&
                      t.cardId === card.id &&
                      t.date >= monthStart &&
                      t.date <= monthEnd
                  )
                  .reduce((sum, t) => sum + t.amount, 0);

                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarBadge variant="card" cardColor={getCardColor(card.name)}>
                        {card.name.slice(0, 2)}
                      </CalendarBadge>
                      <span className="text-sm font-medium">{card.name}</span>
                    </div>
                    {cardUsage > 0 && (
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(cardUsage)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Expense Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            지출 요약
          </h3>
          <div className="p-3 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">총 지출</span>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(todayData.expense)}
              </p>
            </div>
            {todayData.income > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 수입</span>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(todayData.income)}
                </p>
              </div>
            )}
            {todayData.topCategories.length > 0 && (
              <div className="pt-2 border-t space-y-1">
                <span className="text-xs text-muted-foreground">주요 카테고리</span>
                <div className="flex flex-wrap gap-2">
                  {todayData.topCategories.map(({ category, amount }) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-background"
                    >
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-xs font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {todayData.transactions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                아직 거래 내역이 없습니다
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
