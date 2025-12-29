import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCardMonthlyPayments } from "@/hooks/useCardMonthlyPayments";
import { formatCurrency } from "@/lib/formatters";
import { cn, formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Edit3,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import type { Transaction } from "@/types";

export default function HomePage() {
  const { allCategories, incomeCategories, expenseCategories } = useCategories();
  const { assets, totalBalance, addAsset, updateAsset, deleteAsset } = useAssets();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { creditCards } = useCreditCards();
  const monthStr = format(new Date(), "yyyy-MM");
  const { performances } = useCardPerformance(monthStr);
  const { payments, addPayment, updatePayment } = useCardMonthlyPayments(monthStr);

  const recentTransactions = transactions.slice(0, 12);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingPayment, setEditingPayment] = useState<{
    cardId: string;
    cardName: string;
    existingPaymentId?: string;
    currentAmount?: number;
  } | null>(null);
  const [expectedAmountInput, setExpectedAmountInput] = useState("");

  const handleSelectTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  const handleTransactionDialogToggle = (open: boolean) => {
    if (!open) {
      setEditingTransaction(null);
    }
  };

  const handleEditExpectedAmount = (cardId: string, cardName: string, currentAmount?: number) => {
    const existingPayment = payments.find((p) => p.cardId === cardId);
    setEditingPayment({
      cardId,
      cardName,
      existingPaymentId: existingPayment?.id,
      currentAmount: existingPayment?.expectedAmount,
    });
    setExpectedAmountInput(
      existingPayment ? formatAmountInput(String(existingPayment.expectedAmount)) : ""
    );
  };

  const handleSaveExpectedAmount = async () => {
    if (!editingPayment) return;

    const parsedAmount = parseFormattedAmount(expectedAmountInput);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      if (editingPayment.existingPaymentId) {
        await updatePayment(editingPayment.existingPaymentId, {
          expectedAmount: parsedAmount,
        });
      } else {
        await addPayment({
          cardId: editingPayment.cardId,
          month: monthStr,
          expectedAmount: parsedAmount,
        });
      }
      setEditingPayment(null);
      setExpectedAmountInput("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "예상 결제액 저장에 실패했습니다.");
    }
  };

  const handleCancelExpectedAmount = () => {
    setEditingPayment(null);
    setExpectedAmountInput("");
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
        <div className="col-span-5">
          <DashboardKpiCard
            title="총 자산"
            amount={totalBalance}
            icon={Wallet}
            variant="hero"
            subtitle="전체 자산 현황"
          />
        </div>

        {/* Other 3 KPIs (7 columns) */}
        <div className="col-span-7 grid grid-cols-3 gap-4">
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
            title="순수익"
            amount={netIncome}
            icon={TrendingUp}
            variant={netIncome >= 0 ? "net-positive" : "net-negative"}
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
                        {payment.hasExpectedAmount ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-muted-foreground">예상 결제액</p>
                              <button
                                onClick={() =>
                                  handleEditExpectedAmount(
                                    payment.cardId,
                                    payment.cardName,
                                    payment.expectedAmount
                                  )
                                }
                                className="p-0.5 hover:bg-muted/50 rounded transition-colors"
                              >
                                <Edit3 className="h-2.5 w-2.5 text-muted-foreground" />
                              </button>
                            </div>
                            <p className="font-bold text-base tabular-nums text-right">
                              {formatCurrency(payment.expectedAmount!)}
                            </p>
                            <div className="pt-1 border-t">
                              <p className="text-[10px] text-muted-foreground text-right">
                                실제 이용: {formatCurrency(payment.currentMonthSpend)}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-muted-foreground">이용 금액</p>
                              <button
                                onClick={() =>
                                  handleEditExpectedAmount(payment.cardId, payment.cardName)
                                }
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                              >
                                <Edit3 className="h-2.5 w-2.5" />
                                예상액 입력
                              </button>
                            </div>
                            <p className="font-bold text-base tabular-nums text-right">
                              {formatCurrency(payment.currentMonthSpend)}
                            </p>
                          </>
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

      {/* Expected Amount Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={(open) => !open && handleCancelExpectedAmount()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPayment?.cardName} - 예상 결제액 {editingPayment?.existingPaymentId ? "수정" : "입력"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expected-amount">예상 결제 금액</Label>
              <Input
                id="expected-amount"
                type="text"
                inputMode="numeric"
                value={expectedAmountInput}
                onChange={(e) => setExpectedAmountInput(formatAmountInput(e.target.value))}
                placeholder="0"
                className="text-right text-lg font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                이번 달 예상 결제 금액을 입력하세요. 실제 이용 금액과 함께 표시됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelExpectedAmount}>
                취소
              </Button>
              <Button onClick={handleSaveExpectedAmount}>
                {editingPayment?.existingPaymentId ? "수정" : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
