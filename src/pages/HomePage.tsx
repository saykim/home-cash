import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { AssetManagerDialog } from "@/components/assets/AssetManagerDialog";
import { useAssets } from "@/hooks/useAssets";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useCardPerformance } from "@/hooks/useCardPerformance";
import { useAnnualEvents } from "@/hooks/useAnnualEvents";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { getNextOccurrence, getEventTypeLabel } from "@/lib/eventUtils";
import {
  detectRecurringPatterns,
  isPatternAlreadyRegistered,
} from "@/lib/recurringDetection";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  List,
  BarChart3,
  Calendar,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Transaction } from "@/types";

export default function HomePage() {
  const navigate = useNavigate();
  const { allCategories, incomeCategories, expenseCategories } = useCategories();
  const { assets, totalBalance, addAsset, updateAsset, deleteAsset } = useAssets();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { creditCards } = useCreditCards();
  const monthStr = format(new Date(), "yyyy-MM");
  const { performances } = useCardPerformance(monthStr);
  const { annualEvents } = useAnnualEvents();
  const { recurringTransactions } = useRecurringTransactions();

  const recentTransactions = transactions.slice(0, 12);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSelectTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  const handleTransactionDialogToggle = (open: boolean) => {
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const thisMonth = format(new Date(), "yyyy-MM");
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(thisMonth)
  );
  const monthIncome = monthTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = monthTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const netIncome = monthIncome - monthExpense;

  // Upcoming payment notifications
  const upcomingPayments = performances
    .map((perf) => {
      const daysUntil = differenceInDays(
        parseISO(perf.nextBillingDate),
        new Date()
      );
      return {
        ...perf,
        daysUntil,
      };
    })
    .filter((p) => p.daysUntil >= 0 && p.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Upcoming event notifications (D-0 to D-7)
  const upcomingEvents = useMemo(() => {
    return annualEvents
      .map((event) => {
        const nextDate = getNextOccurrence(event);
        const daysUntil = differenceInDays(nextDate, new Date());
        return { ...event, nextDate, daysUntil };
      })
      .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [annualEvents]);

  // Detect recurring transaction patterns
  const suggestedRecurring = useMemo(() => {
    const patterns = detectRecurringPatterns(transactions, allCategories, 3);
    // Filter out patterns that are already registered
    return patterns.filter(
      (pattern) => !isPatternAlreadyRegistered(pattern, recurringTransactions)
    );
  }, [transactions, allCategories, recurringTransactions]);

  const quickActions = [
    { icon: Calendar, label: "캘린더", path: "/calendar" },
    { icon: CreditCard, label: "체리피커", path: "/cherry-picker" },
    { icon: Wallet, label: "카드", path: "/cards" },
    { icon: List, label: "거래", path: "/transactions" },
    { icon: BarChart3, label: "통계", path: "/statistics" },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Date */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko })}
          </p>
        </div>
      </div>

      {/* Top KPI Bar - Hero Total Balance + 3 Metrics */}
      <div className="grid grid-cols-12 gap-4">
        {/* Total Balance - Hero Card (5 columns) */}
        <div className="col-span-5">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0 shadow-xl h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                  총 자산
                </span>
                <Wallet className="h-5 w-5 text-slate-400" />
              </div>
              <div className="text-4xl font-bold tabular-nums tracking-tight mb-1">
                {formatCurrency(totalBalance)}
              </div>
              <div className="text-sm text-slate-400">전체 자산 현황</div>
            </CardContent>
          </Card>
        </div>

        {/* Other 3 KPIs (7 columns) */}
        <div className="col-span-7 grid grid-cols-3 gap-4">
          {/* Monthly Income */}
          <Card className="border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">
                  월 수입
                </span>
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400 tabular-nums">
                {formatCurrency(monthIncome)}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Expense */}
          <Card className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">
                  월 지출
                </span>
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                {formatCurrency(monthExpense)}
              </div>
            </CardContent>
          </Card>

          {/* Net Income */}
          <Card
            className={cn(
              "border",
              netIncome >= 0
                ? "border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20"
                : "border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider",
                    netIncome >= 0
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-orange-700 dark:text-orange-400"
                  )}
                >
                  순수익
                </span>
                <TrendingUp
                  className={cn(
                    "h-4 w-4",
                    netIncome >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-orange-600 dark:text-orange-400"
                  )}
                />
              </div>
              <div
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  netIncome >= 0
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-orange-700 dark:text-orange-400"
                )}
              >
                {formatCurrency(netIncome)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Main Content (8 columns) */}
        <div className="col-span-8 space-y-6">
          {/* Quick Transaction Buttons */}
          <div className="flex gap-3">
            <TransactionForm
              defaultType="INCOME"
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
              assets={assets}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              creditCards={creditCards}
            >
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <ArrowUpRight className="h-5 w-5" />
                수입 입력
              </button>
            </TransactionForm>
            <TransactionForm
              defaultType="EXPENSE"
              addTransaction={addTransaction}
              updateTransaction={updateTransaction}
              deleteTransaction={deleteTransaction}
              assets={assets}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              creditCards={creditCards}
            >
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <ArrowDownRight className="h-5 w-5" />
                지출 입력
              </button>
            </TransactionForm>
          </div>

          {/* Assets Table */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  자산 현황
                </CardTitle>
                <AssetManagerDialog
                  assets={assets}
                  addAsset={addAsset}
                  updateAsset={updateAsset}
                  deleteAsset={deleteAsset}
                >
                  <button className="text-xs text-primary font-medium px-2 py-1 -mx-2 rounded hover:bg-primary/10 transition-colors">
                    관리
                  </button>
                </AssetManagerDialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {assets.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  등록된 자산이 없습니다
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-4 px-5 text-sm font-medium text-muted-foreground">
                          자산명
                        </th>
                        <th className="text-left py-4 px-5 text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="text-right py-4 px-5 text-sm font-medium text-muted-foreground">
                          잔액
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {assets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="group hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer relative"
                        >
                          <td className="relative py-4 px-5">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  asset.type === "BANK"
                                    ? "bg-blue-100 dark:bg-blue-900/30"
                                    : "bg-amber-100 dark:bg-amber-900/30"
                                )}
                              >
                                <Wallet
                                  className={cn(
                                    "h-4 w-4",
                                    asset.type === "BANK"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-amber-600 dark:text-amber-400"
                                  )}
                                />
                              </div>
                              <span className="font-medium text-base">
                                {asset.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-sm text-muted-foreground">
                              {asset.type === "BANK" ? "계좌" : "현금"}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <span className="font-bold text-base tabular-nums">
                              {formatCurrency(asset.balance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions Table */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  최근 거래
                </CardTitle>
                <button
                  onClick={() => navigate("/transactions")}
                  className="text-xs text-primary font-medium px-2 py-1 -mx-2 rounded hover:bg-primary/10 transition-colors"
                >
                  전체보기
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  거래 내역이 없습니다
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-4 px-5 text-sm font-medium text-muted-foreground">
                          날짜
                        </th>
                        <th className="text-left py-4 px-5 text-sm font-medium text-muted-foreground">
                          내용
                        </th>
                        <th className="text-left py-4 px-5 text-sm font-medium text-muted-foreground">
                          구분
                        </th>
                        <th className="text-right py-4 px-5 text-sm font-medium text-muted-foreground">
                          금액
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {recentTransactions.map((tx) => {
                        const category = allCategories.find(
                          (c) => c.id === tx.categoryId
                        );
                        return (
                          <tr
                            key={tx.id}
                            className="group hover:bg-muted/30 hover:shadow-sm transition-all cursor-pointer relative"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectTransaction(tx)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleSelectTransaction(tx);
                              }
                            }}
                          >
                            <td className="relative py-4 px-5">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                              <span className="text-sm text-muted-foreground tabular-nums">
                                {format(new Date(tx.date), "MM/dd")}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span className="font-medium text-base">
                                {tx.memo || category?.name || "거래"}
                              </span>
                            </td>
                            <td className="py-4 px-5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                  tx.type === "INCOME" &&
                                    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                                  tx.type === "EXPENSE" &&
                                    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                                  tx.type === "TRANSFER" &&
                                    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                )}
                              >
                                {tx.type === "INCOME"
                                  ? "수입"
                                  : tx.type === "EXPENSE"
                                  ? "지출"
                                  : "이체"}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right">
                              <span
                                className={cn(
                                  "font-bold text-base tabular-nums",
                                  tx.type === "INCOME"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                )}
                              >
                                {tx.type === "INCOME" ? "+" : "-"}
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar (4 columns) */}
        <div className="col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card className="border hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">
                빠른 실행
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                    <span className="text-xs font-medium group-hover:text-primary transition-colors">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <Card className="border border-pink-200 dark:border-pink-900/50 bg-pink-50/30 dark:bg-pink-950/10">
              <CardHeader className="pb-3 border-b border-pink-200 dark:border-pink-900/50">
                <CardTitle className="text-base font-semibold text-pink-700 dark:text-pink-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  다가오는 이벤트
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        event.daysUntil === 0 &&
                          "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-800",
                        event.daysUntil > 0 &&
                          event.daysUntil <= 3 &&
                          "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-800",
                        event.daysUntil > 3 &&
                          "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm leading-tight">
                            {event.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getEventTypeLabel(event.type)} ·{" "}
                            {format(event.nextDate, "M/d (E)", { locale: ko })}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            event.daysUntil === 0 && "bg-pink-600 text-white",
                            event.daysUntil > 0 &&
                              event.daysUntil <= 3 &&
                              "bg-orange-600 text-white",
                            event.daysUntil > 3 && "bg-blue-600 text-white"
                          )}
                        >
                          {event.daysUntil === 0
                            ? "오늘!"
                            : `D-${event.daysUntil}`}
                        </div>
                      </div>
                      {event.amount && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">예산</p>
                          <p className="font-bold text-base tabular-nums">
                            {formatCurrency(event.amount)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Payments */}
          {upcomingPayments.length > 0 && (
            <Card className="border border-orange-200 dark:border-orange-900/50 bg-orange-50/30 dark:bg-orange-950/10">
              <CardHeader className="pb-3 border-b border-orange-200 dark:border-orange-900/50">
                <CardTitle className="text-base font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  결제 예정
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {upcomingPayments.map((payment) => (
                    <div
                      key={payment.cardId}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        payment.daysUntil === 0 &&
                          "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800",
                        payment.daysUntil > 0 &&
                          payment.daysUntil <= 3 &&
                          "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-800",
                        payment.daysUntil > 3 &&
                          "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm leading-tight">
                            {payment.cardName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(
                              parseISO(payment.nextBillingDate),
                              "M/d (E)",
                              { locale: ko }
                            )}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            payment.daysUntil === 0 && "bg-red-600 text-white",
                            payment.daysUntil > 0 &&
                              payment.daysUntil <= 3 &&
                              "bg-orange-600 text-white",
                            payment.daysUntil > 3 && "bg-blue-600 text-white"
                          )}
                        >
                          {payment.daysUntil === 0
                            ? "오늘"
                            : `D-${payment.daysUntil}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base tabular-nums">
                          {formatCurrency(payment.billingAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggested Recurring Transactions */}
          {suggestedRecurring.length > 0 && (
            <Card className="border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/10">
              <CardHeader className="pb-3 border-b border-purple-200 dark:border-purple-900/50">
                <CardTitle className="text-base font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  반복 거래 제안
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  최근 {suggestedRecurring.length}개의 반복 패턴이
                  감지되었습니다
                </p>
              </CardHeader>
              <CardContent className="p-3">
                <div className="space-y-2">
                  {suggestedRecurring.slice(0, 3).map((pattern) => (
                    <div
                      key={pattern.categoryId}
                      className="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-purple-950/20 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm leading-tight">
                            {pattern.categoryName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            최근 {pattern.occurrences}개월 연속 발생 · 신뢰도{" "}
                            {pattern.confidence}%
                          </p>
                        </div>
                        <div className="px-2 py-1 rounded text-xs font-bold bg-purple-600 text-white">
                          {(pattern.averageAmount / 10000).toFixed(1)}만원
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {pattern.suggestion}
                      </p>
                      <button
                        onClick={() => navigate("/settings")}
                        className="mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline"
                      >
                        정기 거래로 등록 →
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TransactionForm
        hideTrigger
        editTransaction={editingTransaction}
        onOpenChange={handleTransactionDialogToggle}
        addTransaction={addTransaction}
        updateTransaction={updateTransaction}
        deleteTransaction={deleteTransaction}
        assets={assets}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        creditCards={creditCards}
      />
    </div>
  );
}
