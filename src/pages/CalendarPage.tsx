import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { AnnualEventForm } from "@/components/calendar/AnnualEventForm";
import { BudgetProgress } from "@/components/calendar/BudgetProgress";
import { RangeStats } from "@/components/calendar/RangeStats";
import { CategoryFilter } from "@/components/calendar/CategoryFilter";
import { CalendarBadge, getCardColor } from "@/components/calendar/CalendarBadge";
import { TodaySchedule } from "@/components/calendar/TodaySchedule";
import { WeeklySummary } from "@/components/calendar/WeeklySummary";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAssets } from "@/hooks/useAssets";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useAnnualEvents } from "@/hooks/useAnnualEvents";
import { useBudgets } from "@/hooks/useBudgets";
import { formatCurrency } from "@/lib/formatters";
import { getEventTypeLabel, calculateYears } from "@/lib/eventUtils";
import { getTopCategoryIcon } from "@/lib/categoryIcons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  subMonths,
  addMonths,
  setYear,
  setMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null);

  // Range selection state
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Category filter state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );

  const monthStr = format(currentMonth, "yyyy-MM");
  const prevMonthStr = format(subMonths(currentMonth, 1), "yyyy-MM");

  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions(monthStr);
  const { transactions: prevMonthTransactions } = useTransactions(prevMonthStr);
  const { allCategories, incomeCategories, expenseCategories } = useCategories();
  const { assets } = useAssets();
  const { creditCards } = useCreditCards();
  const { annualEvents, addAnnualEvent, updateAnnualEvent, deleteAnnualEvent, refetch: refetchAnnualEvents } = useAnnualEvents();
  const { budgets } = useBudgets(monthStr);

  // Filter transactions by selected categories
  const filteredTransactions = useMemo(() => {
    if (selectedCategories.size === 0) return transactions;
    return transactions.filter((tx) => selectedCategories.has(tx.categoryId));
  }, [transactions, selectedCategories]);

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach((tx) => {
      const key = tx.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    });
    return map;
  }, [filteredTransactions]);

  // Previous month transactions by day of month
  const prevMonthByDay = useMemo(() => {
    const map = new Map<number, { income: number; expense: number }>();
    prevMonthTransactions.forEach((tx) => {
      const day = new Date(tx.date).getDate();
      if (!map.has(day)) {
        map.set(day, { income: 0, expense: 0 });
      }
      const data = map.get(day)!;
      if (tx.type === "INCOME") {
        data.income += tx.amount;
      } else if (tx.type === "EXPENSE") {
        data.expense += tx.amount;
      }
    });
    return map;
  }, [prevMonthTransactions]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Calculate max expense for the month (for color intensity)
  const maxExpense = useMemo(() => {
    const expensesByDay = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      if (tx.type === "EXPENSE") {
        const current = expensesByDay.get(tx.date) || 0;
        expensesByDay.set(tx.date, current + tx.amount);
      }
    });
    return Math.max(...Array.from(expensesByDay.values()), 0);
  }, [filteredTransactions]);

  const getDayData = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayTxs = transactionsByDate.get(key) ?? [];
    const income = dayTxs
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTxs
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const isNoSpend = dayTxs.length > 0 && expense === 0;

    // 카드별 지출 계산
    const cardExpenses = new Map<string, number>();
    dayTxs
      .filter((t) => t.type === "EXPENSE" && t.cardId)
      .forEach((tx) => {
        const current = cardExpenses.get(tx.cardId!) || 0;
        cardExpenses.set(tx.cardId!, current + tx.amount);
      });

    // 이 날짜가 카드 결제일인지 확인
    const dayOfMonth = date.getDate();
    const billingCards = creditCards.filter(
      (card) => card.billingDay === dayOfMonth
    );

    // 이 날짜의 연례 이벤트 필터링
    const monthOfYear = date.getMonth() + 1;
    const dayEvents = annualEvents.filter(
      (e) => e.month === monthOfYear && e.day === dayOfMonth
    );

    // 전월 동일 날짜 비교
    const prevMonthData = prevMonthByDay.get(dayOfMonth) || {
      income: 0,
      expense: 0,
    };
    const expenseChange = expense - prevMonthData.expense;
    const incomeChange = income - prevMonthData.income;

    return {
      transactions: dayTxs,
      income,
      expense,
      isNoSpend,
      cardExpenses,
      billingCards,
      events: dayEvents,
      comparison: {
        prevExpense: prevMonthData.expense,
        prevIncome: prevMonthData.income,
        expenseChange,
        incomeChange,
      },
    };
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(currentMonth, parseInt(yearStr));
    setCurrentMonth(newDate);
    setSelectedDate(null);
  };

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(currentMonth, parseInt(monthStr) - 1);
    setCurrentMonth(newDate);
    setSelectedDate(null);
  };

  const getCategoryName = (categoryId: string) => {
    return allCategories.find((c) => c.id === categoryId)?.name || "기타";
  };

  // Range selection handlers
  const handleRangeMouseDown = (date: Date) => {
    setIsDragging(true);
    setRangeStart(date);
    setRangeEnd(date);
    setSelectedDate(null); // Clear single date selection
  };

  const handleRangeMouseOver = (date: Date) => {
    if (isDragging && rangeStart) {
      setRangeEnd(date);
    }
  };

  const handleRangeMouseUp = () => {
    setIsDragging(false);
  };

  const clearRangeSelection = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  // Category filter handlers
  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const clearCategoryFilter = () => {
    setSelectedCategories(new Set());
  };

  // Check if date is in selected range
  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;
    return date >= start && date <= end;
  };

  // Calculate range statistics
  const rangeStats = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;

    const start = rangeStart < rangeEnd ? rangeStart : rangeEnd;
    const end = rangeStart < rangeEnd ? rangeEnd : rangeStart;

    const rangeTxs = filteredTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });

    const totalIncome = rangeTxs
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = rangeTxs
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown
    const categoryBreakdown = new Map<string, number>();
    rangeTxs
      .filter((t) => t.type === "EXPENSE")
      .forEach((tx) => {
        const current = categoryBreakdown.get(tx.categoryId) || 0;
        categoryBreakdown.set(tx.categoryId, current + tx.amount);
      });

    const categories = Array.from(categoryBreakdown.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: getCategoryName(categoryId),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      start,
      end,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      transactionCount: rangeTxs.length,
      categories,
    };
  }, [rangeStart, rangeEnd, filteredTransactions, allCategories]);

  // Generate year options (current year ± 5 years)
  const currentYear = currentMonth.getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">캘린더</h1>
          <AnnualEventForm
            addAnnualEvent={addAnnualEvent}
            updateAnnualEvent={updateAnnualEvent}
            deleteAnnualEvent={deleteAnnualEvent}
            onSaved={({ month, day }) => {
              // 저장 후 즉시 캘린더가 갱신되고, 해당 월/일로 이동해 사용자가 바로 확인 가능하도록 함
              refetchAnnualEvents();
              const target = new Date(currentMonth.getFullYear(), month - 1, day);
              setCurrentMonth(target);
              setSelectedDate(target);
            }}
          >
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              이벤트 추가
            </Button>
          </AnnualEventForm>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <Select
              value={String(currentMonth.getFullYear())}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(currentMonth.getMonth() + 1)}
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={String(month)}>
                    {month}월
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
      </div>

      {/* Main Content with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* Left Sidebar - Today's Schedule & Weekly Summary */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start order-2 lg:order-1">
          <TodaySchedule
            transactions={transactions}
            categories={allCategories}
            creditCards={creditCards}
            annualEvents={annualEvents}
          />
          <WeeklySummary
            transactions={transactions}
            categories={allCategories}
          />
        </div>

        {/* Right Main Content - Calendar and Charts */}
        <div className="space-y-4 order-1 lg:order-2">
      {/* Budget Progress */}
      {budgets.length > 0 && (
        <Card className="p-4">
          <BudgetProgress
            transactions={transactions}
            budgets={budgets}
            allCategories={allCategories}
          />
        </Card>
      )}

      {/* Range Statistics */}
      {rangeStats && (
        <Card className="p-4">
          <RangeStats stats={rangeStats} onClear={clearRangeSelection} />
        </Card>
      )}

      {/* Range Selection Hint */}
      {!rangeStats && (
        <div className="text-xs text-muted-foreground text-center py-2">
          💡 Shift 키를 누른 상태로 날짜를 드래그하면 기간 통계를 볼 수 있습니다
        </div>
      )}

      <CategoryFilter
        categories={allCategories}
        selectedCategoryIds={selectedCategories}
        onToggle={toggleCategoryFilter}
        onClear={clearCategoryFilter}
      />

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <TooltipProvider>
        <div
          className="grid grid-cols-7 gap-1"
          onMouseUp={handleRangeMouseUp}
          onMouseLeave={handleRangeMouseUp}
        >
          {/* Padding for first week */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {days.map((date) => {
            const {
              income,
              expense,
              isNoSpend,
              transactions: dayTxs,
              billingCards,
              events,
              comparison,
            } = getDayData(date);
            const hasData = dayTxs.length > 0;
            const isSelected = Boolean(
              selectedDate &&
                format(selectedDate, "yyyy-MM-dd") ===
                  format(date, "yyyy-MM-dd")
            );

            // Get top category icon
            const CategoryIcon = getTopCategoryIcon(dayTxs, allCategories);

            // Check if weekend
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

            // Calculate expense intensity (0-100)
            const expenseIntensity =
              maxExpense > 0 ? Math.min((expense / maxExpense) * 100, 100) : 0;

            // Determine background color based on expense intensity
            let expenseColorClass = "";
            if (!isSelected && !isNoSpend && expense > 0) {
              if (expenseIntensity >= 80) {
                expenseColorClass =
                  "bg-red-100 dark:bg-red-900/30 border-red-200";
              } else if (expenseIntensity >= 60) {
                expenseColorClass =
                  "bg-red-50 dark:bg-red-900/20 border-red-100";
              } else if (expenseIntensity >= 40) {
                expenseColorClass =
                  "bg-orange-50 dark:bg-orange-900/20 border-orange-100";
              } else if (expenseIntensity >= 20) {
                expenseColorClass =
                  "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100";
              }
            }

            // Weekend background (when no other special backgrounds apply)
            const weekendColorClass =
              isWeekend && !isSelected && !isNoSpend && !expenseColorClass
                ? "bg-blue-50/50 dark:bg-blue-900/10"
                : "";

            // Tooltip text with exact amounts and month-over-month comparison
            const tooltipLines = [
              income > 0 ? `수입: ${formatCurrency(income)}` : null,
              expense > 0 ? `지출: ${formatCurrency(expense)}` : null,
              billingCards.length > 0
                ? `결제일: ${billingCards.map((c) => c.name).join(", ")}`
                : null,
              events.length > 0
                ? `이벤트: ${events.map((e) => e.name).join(", ")}`
                : null,
            ].filter(Boolean);

            // Add comparison if data exists
            if (comparison.prevExpense > 0 || expense > 0) {
              const change = comparison.expenseChange;
              const changeText =
                change > 0
                  ? `+${formatCurrency(change)}`
                  : change < 0
                  ? formatCurrency(change)
                  : "변화 없음";
              tooltipLines.push(`전월 대비: ${changeText}`);
            }

            const tooltipText = tooltipLines.join("\n") || undefined;

            const inRange = isInRange(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                onMouseDown={(e) => {
                  if (e.shiftKey) {
                    e.preventDefault();
                    handleRangeMouseDown(date);
                  }
                }}
                onMouseOver={() => handleRangeMouseOver(date)}
                title={tooltipText}
                className={cn(
                  "group relative h-24 p-1 rounded-lg text-sm transition-all border flex flex-col",
                  isToday(date) && "ring-2 ring-primary",
                  isSelected &&
                    "bg-primary text-primary-foreground border-primary",
                  inRange &&
                    !isSelected &&
                    "bg-blue-100 dark:bg-blue-900/30 border-blue-300",
                  isNoSpend &&
                    !isSelected &&
                    !inRange &&
                    "bg-green-50 dark:bg-green-900/20 border-green-200",
                  !inRange && expenseColorClass,
                  !inRange && weekendColorClass,
                  !isSelected &&
                    !inRange &&
                    !isNoSpend &&
                    !expenseColorClass &&
                    !weekendColorClass &&
                    "hover:bg-accent"
                )}
              >
                {/* Quick add button (visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickAddDate(date);
                  }}
                  className={cn(
                    "absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:scale-110",
                    isSelected && "bg-primary-foreground text-primary"
                  )}
                  title="빠른 거래 추가"
                >
                  <Plus className="h-3 w-3" />
                </button>

                {/* 상단: 날짜 + 표시자들 */}
                <div className="flex items-start justify-between mb-0.5 w-full">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span
                      className={cn(
                        "font-medium text-xs",
                        isToday(date) && !isSelected && "text-primary"
                      )}
                    >
                      {format(date, "d")}
                    </span>
                    {dayTxs.length > 0 && (
                      <CalendarBadge
                        variant="transaction"
                        className={cn(
                          isSelected && "bg-primary-foreground/20 text-primary-foreground"
                        )}
                      >
                        {dayTxs.length}
                      </CalendarBadge>
                    )}
                    {billingCards.slice(0, 2).map((card, idx) => (
                      <CalendarBadge
                        key={idx}
                        variant="card"
                        cardColor={getCardColor(card.name)}
                        tooltip={`${card.name} 결제일`}
                        className="cursor-help"
                      >
                        {card.name.slice(0, 2)}
                      </CalendarBadge>
                    ))}
                    {billingCards.length > 2 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{billingCards.length - 2}
                      </span>
                    )}
                    {events.slice(0, 2).map((event, idx) => (
                      <CalendarBadge
                        key={idx}
                        variant="event"
                        tooltip={event.name}
                        className="cursor-help font-bold"
                      >
                        {event.name.slice(0, 2)}
                      </CalendarBadge>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{events.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* 하단: 금액 및 거래 내역 */}
                <div className="mt-auto flex flex-col gap-1 w-full px-0.5">
                  {/* Total Amount */}
                  <div className={cn(
                    "text-center font-bold text-xs",
                    expense > 0 && !isSelected && "text-foreground",
                    isSelected && "text-primary-foreground"
                  )}>
                    {expense > 0 ? `W${expense.toLocaleString()}` : 'W0'}
                  </div>

                  {/* Category Transactions (max 2) */}
                  {dayTxs.slice(0, 2).map((tx) => {
                    const category = allCategories.find(c => c.id === tx.categoryId);
                    if (!category) return null;

                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          "text-[9px] leading-tight flex items-center gap-0.5",
                          tx.type === "INCOME" ? "text-green-600" : "text-red-600",
                          isSelected && "text-primary-foreground opacity-90"
                        )}
                      >
                        <span>{category.icon}</span>
                        <span className="truncate">{category.name}</span>
                        <span className="ml-auto">W{(tx.amount / 10000).toFixed(0)}만</span>
                      </div>
                    );
                  })}
                  {dayTxs.length > 2 && (
                    <div className="text-[9px] text-muted-foreground text-center">
                      +{dayTxs.length - 2}건
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Selected Day Transactions */}
      {selectedDate &&
        (() => {
          const dayData = getDayData(selectedDate);
          const {
            transactions: dayTxs,
            cardExpenses,
            billingCards,
            events,
          } = dayData;

          return (
            <Card className="p-4">
              <h3 className="font-bold mb-3">
                {format(selectedDate, "M월 d일 (E)", { locale: ko })}
              </h3>

              {/* 연례 이벤트 정보 */}
              {events.length > 0 && (
                <div className="mb-4 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-l-4 border-pink-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-pink-600" />
                    <p className="font-semibold text-sm text-pink-900 dark:text-pink-100">
                      연례 이벤트 ({events.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {events.map((event) => {
                      const years = calculateYears(event);
                      return (
                        <button
                          key={event.id}
                          onClick={() => setEditingEvent(event)}
                          className="w-full flex justify-between items-start p-2 rounded hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors text-left"
                        >
                          <div>
                            <p className="font-medium text-sm text-pink-800 dark:text-pink-200">
                              • {event.name}
                            </p>
                            <p className="text-xs text-pink-600 dark:text-pink-300">
                              {getEventTypeLabel(event.type)}
                              {years && ` · ${years}회차`}
                            </p>
                            {event.memo && (
                              <p className="text-xs text-pink-500 dark:text-pink-400 mt-0.5">
                                {event.memo}
                              </p>
                            )}
                          </div>
                          {event.amount && (
                            <p className="font-semibold text-sm text-pink-900 dark:text-pink-100">
                              예산: {formatCurrency(event.amount)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 카드 결제일 정보 */}
              {billingCards.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                      {billingCards.length}개 카드 결제일
                    </p>
                  </div>
                  <div className="space-y-1">
                    {billingCards.map((card) => (
                      <p
                        key={card.id}
                        className="text-sm text-blue-700 dark:text-blue-200 font-medium"
                      >
                        • {card.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* 카드별 사용 금액 요약 */}
              {cardExpenses.size > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-l-4 border-amber-500">
                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                    카드 사용 내역 ({cardExpenses.size}건)
                  </p>
                  <div className="space-y-1.5">
                    {Array.from(cardExpenses.entries()).map(
                      ([cardId, amount]) => {
                        const card = creditCards.find((c) => c.id === cardId);
                        return (
                          <div
                            key={cardId}
                            className="flex justify-between text-sm items-center"
                          >
                            <span className="text-amber-700 dark:text-amber-200 font-medium">
                              • {card?.name || "알 수 없는 카드"}
                            </span>
                            <span className="font-bold text-amber-900 dark:text-amber-100">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* 거래 내역 */}
              {dayTxs.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  거래 내역이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {dayTxs.map((tx) => {
                    const card = tx.cardId
                      ? creditCards.find((c) => c.id === tx.cardId)
                      : null;
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setEditingTransaction(tx)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-accent transition-colors text-left"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {tx.memo || getCategoryName(tx.categoryId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.type === "INCOME"
                              ? "수입"
                              : tx.type === "EXPENSE"
                              ? "지출"
                              : "이체"}
                            {card && ` · ${card.name}`}
                          </p>
                        </div>
                        <p
                          className={cn(
                            "font-semibold",
                            tx.type === "INCOME"
                              ? "amount-income"
                              : tx.type === "EXPENSE"
                              ? "amount-expense"
                              : "amount-transfer"
                          )}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })()}

      {/* Main transaction form - for FAB and editing */}
      {!quickAddDate && (
        <TransactionForm
          defaultDate={selectedDate}
          editTransaction={editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransaction(null);
            }
          }}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
          assets={assets}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          creditCards={creditCards}
        />
      )}

      {/* Quick add form - opens automatically when quickAddDate is set */}
      {quickAddDate && (
        <TransactionForm
          defaultDate={quickAddDate}
          autoOpen={true}
          onOpenChange={(open) => {
            if (!open) {
              setQuickAddDate(null);
            }
          }}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          deleteTransaction={deleteTransaction}
          assets={assets}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          creditCards={creditCards}
        >
          <div style={{ display: "none" }} />
        </TransactionForm>
      )}

      {/* Hidden event form for editing */}
      {editingEvent && (
        <AnnualEventForm
          editEvent={editingEvent}
          addAnnualEvent={addAnnualEvent}
          updateAnnualEvent={updateAnnualEvent}
          deleteAnnualEvent={deleteAnnualEvent}
          onSaved={({ month, day }) => {
            refetchAnnualEvents();
            const target = new Date(currentMonth.getFullYear(), month - 1, day);
            setCurrentMonth(target);
            setSelectedDate(target);
          }}
          onOpenChange={(open) => {
            if (!open) {
              setEditingEvent(null);
            }
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
}
