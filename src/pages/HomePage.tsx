import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { AssetManagerDialog } from "@/components/assets/AssetManagerDialog";
import { QuickActionsBar } from "@/components/home/QuickActionsBar";
import { DashboardKpiCard } from "@/components/home/DashboardKpiCard";
import { useAssets } from "@/hooks/useAssets";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCreditCards } from "@/hooks/useCreditCards";
import { useCardPerformance } from "@/hooks/useCardPerformance";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Edit2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Transaction } from "@/types";

export default function HomePage() {
  const { allCategories, incomeCategories, expenseCategories } =
    useCategories();
  const { assets, totalBalance, addAsset, updateAsset, deleteAsset } =
    useAssets();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();
  const { creditCards } = useCreditCards();
  const monthStr = format(new Date(), "yyyy-MM");
  const { performances, updateManualAmount } = useCardPerformance(monthStr);

  const recentTransactions = transactions.slice(0, 12);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Manual billing amount editing state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [tempAmount, setTempAmount] = useState<string>("");

  const startEditing = (cardId: string, currentAmount: number) => {
    setEditingCardId(cardId);
    setTempAmount(currentAmount.toString());
  };

  const saveEditing = (cardId: string) => {
    const amount = parseFloat(tempAmount);
    if (!isNaN(amount)) {
      updateManualAmount(cardId, amount);
    }
    setEditingCardId(null);
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  const handleTransactionDialogToggle = (open: boolean) => {
    if (!open) {
      setEditingTransaction(null);
    }
  };

  /*
   * Available Balance 계산 로직 수정
   * 기존: 수입 - 전체지출 - 청구금액 (신용카드 지출이 전체지출과 청구금액에서 이중 차감됨)
   * 수정: 수입 - (전체지출 - 신용카드지출) - 청구금액
   * 설명: '전체지출 - 신용카드지출'은 현금/체크카드 지출을 의미. 여기에 보정된(수기입력 포함) 청구금액을 뺌.
   */
  /*
   * Available Balance 계산 로직 수정 (현금 흐름 모델)
   * 1. monthIncome: 이번 달 총 수입
   * 2. monthCashExpense: 현금성 지출 (전체 지출 - 신용카드 이용 금액)
   * 3. billingAmountDueThisMonth: 이번 달에 결제일이 도래하는 카드 대금 (수기 보정 금액 반영)
   * 공식: 수입 - 현금성지출 - 이번달 카드결제액
   */
  const { totalIncome: monthIncome, totalExpense: monthExpense } =
    usePeriodStats("month", new Date());

  // 신용카드 이용 금액 (이번 달 지출 중 신용카드 긁은 금액)
  const monthCreditSpend = performances
    .filter((p) => p.cardType === "CREDIT")
    .reduce((sum, p) => sum + p.currentMonthSpend, 0);

  // 현금성 지출 (체크카드 포함, 신용카드 지출 제외)
  const monthCashExpense = monthExpense - monthCreditSpend;

  // 이번 달 내에 납부해야 하는 카드 대금 합계 (수기 입력값 우선)
  const currentMonthStr = format(new Date(), "yyyy-MM");
  const billingAmountDueThisMonth = performances
    .filter(
      (p) => p.nextBillingDate && p.nextBillingDate.startsWith(currentMonthStr)
    )
    .reduce((sum, p) => sum + p.billingAmount, 0);

  const availableBalance =
    monthIncome - monthCashExpense - billingAmountDueThisMonth;

  // Upcoming payment notifications (신용카드만)
  const upcomingPayments = performances
    // .filter(perf => perf.cardType === "CREDIT") // cardType property might be missing in API response
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
    .filter((p) => p.daysUntil >= 0) // Show all future payments
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="space-y-3">
      {/* Header with Date */}
      <PageHeader
        title="대시보드"
        description={format(new Date(), "yyyy년 M월 d일 EEEE", { locale: ko })}
      />

      {/* Top KPI Bar - Hero Total Balance + 3 Metrics */}
      <div className="grid grid-cols-12 gap-4">
        {/* Total Balance - Hero Card (5 columns) */}
        <div className="col-span-12 md:col-span-5">
          <DashboardKpiCard
            title="총 자산"
            amount={totalBalance}
            icon={Wallet}
            variant="hero"
            subtitle="전체 자산 현황"
          />
        </div>

        {/* Other 3 KPIs (7 columns) */}
        <div className="col-span-12 md:col-span-7 grid grid-cols-3 gap-4">
          <DashboardKpiCard
            title="월 수입"
            amount={monthIncome}
            icon={ArrowUpRight}
            variant="income"
          />
          <DashboardKpiCard
            title="월 지출"
            amount={monthExpense}
            icon={ArrowDownRight}
            variant="expense"
          />
          <DashboardKpiCard
            title="가용 잔액"
            amount={availableBalance}
            icon={availableBalance >= 0 ? TrendingUp : AlertCircle}
            variant={availableBalance >= 0 ? "net-positive" : "net-negative"}
            subtitle="수입 - (지출 + 예정)"
          />
        </div>
      </div>

      {/* Quick Actions Navigation Bar */}
      <QuickActionsBar
        assets={assets}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        creditCards={creditCards}
        addTransaction={addTransaction}
        updateTransaction={updateTransaction}
        deleteTransaction={deleteTransaction}
      />

      {/* Main Dashboard Grid - 3 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        {/* Left Column - Assets (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Assets Table */}
          <Card className="border">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
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
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                          자산명
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">
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
                          <td className="relative py-2.5 px-3">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "p-1.5 rounded-lg",
                                  asset.type === "BANK"
                                    ? "bg-blue-100 dark:bg-blue-900/30"
                                    : "bg-amber-100 dark:bg-amber-900/30"
                                )}
                              >
                                <Wallet
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    asset.type === "BANK"
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-amber-600 dark:text-amber-400"
                                  )}
                                />
                              </div>
                              <span className="font-medium text-sm">
                                {asset.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs text-muted-foreground">
                              {asset.type === "BANK" ? "계좌" : "현금"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className="font-bold text-sm tabular-nums">
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
        </div>

        {/* Middle Column - Recent Transactions (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recent Transactions Table */}
          <Card className="border">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  최근 거래
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  거래 내역이 없습니다
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                          날짜
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                          내용
                        </th>
                        <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                          구분
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">
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
                            <td className="relative py-2.5 px-3">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-r" />
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {format(new Date(tx.date), "MM/dd")}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-medium text-sm">
                                {tx.memo || category?.name || "거래"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
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
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={cn(
                                  "font-bold text-sm tabular-nums",
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

        {/* Right Column - Upcoming Payments (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upcoming Payments */}
          <Card className="border">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  결제 예정
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingPayments.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  예정된 결제가 없습니다
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto p-2.5 space-y-1.5">
                  {upcomingPayments.map((payment) => (
                    <div
                      key={payment.cardId}
                      className={cn(
                        "p-2.5 rounded-lg border transition-all hover:shadow-md",
                        payment.daysUntil === 0 &&
                          "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
                        payment.daysUntil > 0 &&
                          payment.daysUntil <= 3 &&
                          "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50",
                        payment.daysUntil > 3 &&
                          "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1">
                          <p className="font-semibold text-xs leading-tight">
                            {payment.cardName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            결제일:{" "}
                            {format(
                              parseISO(payment.nextBillingDate),
                              "M/d (E)",
                              { locale: ko }
                            )}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">
                            이용 금액
                          </p>
                          {editingCardId === payment.cardId ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => saveEditing(payment.cardId)}
                                className="p-0.5 hover:bg-green-100 rounded text-green-600"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setEditingCardId(null)}
                                className="p-0.5 hover:bg-red-100 rounded text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                startEditing(
                                  payment.cardId,
                                  payment.billingAmount
                                )
                              }
                              className="text-[10px] text-muted-foreground hover:text-primary p-0.5 -mr-1"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {editingCardId === payment.cardId ? (
                          <div className="flex justify-end">
                            <Input
                              type="number"
                              value={tempAmount}
                              onChange={(e) => setTempAmount(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  saveEditing(payment.cardId);
                                if (e.key === "Escape") setEditingCardId(null);
                              }}
                              className="h-7 text-right w-24 text-sm px-2 py-1"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {payment.billingAmount !==
                              payment.currentMonthSpend && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                {formatCurrency(payment.currentMonthSpend)}
                              </span>
                            )}
                            <p
                              className={cn(
                                "font-bold text-base tabular-nums text-right cursor-pointer hover:underline decoration-dashed decoration-muted-foreground/50",
                                payment.billingAmount !==
                                  payment.currentMonthSpend && "text-primary"
                              )}
                              onClick={() =>
                                startEditing(
                                  payment.cardId,
                                  payment.billingAmount
                                )
                              }
                            >
                              {formatCurrency(payment.billingAmount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
