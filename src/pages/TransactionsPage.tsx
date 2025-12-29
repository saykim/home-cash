import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/PageHeader";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { PeriodSelector } from "@/components/common/PeriodSelector";
import { PeriodNavigator } from "@/components/common/PeriodNavigator";
import { TransactionSummary } from "@/components/transactions/TransactionSummary";
import { CategoryGroup } from "@/components/transactions/CategoryGroup";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAssets } from "@/hooks/useAssets";
import { useCreditCards } from "@/hooks/useCreditCards";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import {
  getPeriodRange,
  getPreviousPeriod,
  getNextPeriod,
} from "@/lib/periodUtils";
import { Search, Filter, X } from "lucide-react";
import type { PeriodMode, Transaction } from "@/types";

export default function TransactionsPage() {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const periodRange = useMemo(
    () => getPeriodRange(periodMode, currentDate),
    [periodMode, currentDate]
  );
  const stats = usePeriodStats(periodMode, currentDate);

  const { allCategories, incomeCategories, expenseCategories } =
    useCategories();
  const { assets } = useAssets();
  const { creditCards } = useCreditCards();

  // 현재 기간의 모든 거래 조회 (useLiveQuery 대신 직접 구현)
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();

  // 기간 필터링된 거래
  const periodTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.date >= periodRange.start && tx.date <= periodRange.end
    );
  }, [transactions, periodRange]);

  const handlePrevious = () => {
    setCurrentDate(getPreviousPeriod(periodMode, currentDate));
  };

  const handleNext = () => {
    setCurrentDate(getNextPeriod(periodMode, currentDate));
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 거래를 삭제하시겠습니까?")) {
      await deleteTransaction(id);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return allCategories.find((c) => c.id === categoryId)?.name || "기타";
  };

  const getAccountName = (assetId?: string, cardId?: string) => {
    if (cardId && cardId !== "NONE") {
      return (
        creditCards.find((c) => c.id === cardId)?.name || "알 수 없음(카드)"
      );
    }
    return assets.find((a) => a.id === assetId)?.name || "알 수 없음";
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const memo = tx.memo?.toLowerCase() || "";
        const categoryName = getCategoryName(tx.categoryId).toLowerCase();
        const accountName = getAccountName(tx.assetId, tx.cardId).toLowerCase();

        if (
          !memo.includes(query) &&
          !categoryName.includes(query) &&
          !accountName.includes(query)
        ) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && tx.categoryId !== categoryFilter) {
        return false;
      }

      // Asset filter
      if (assetFilter !== "all" && tx.assetId !== assetFilter) {
        return false;
      }

      return true;
    });
  }, [
    periodTransactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    assetFilter,
  ]);

  // 카테고리별 그룹화
  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    filteredTransactions.forEach((tx) => {
      if (!groups.has(tx.categoryId)) {
        groups.set(tx.categoryId, []);
      }
      groups.get(tx.categoryId)!.push(tx);
    });

    // 각 그룹 내에서 날짜순 정렬 (최신순)
    groups.forEach((txList) => {
      txList.sort((a, b) => b.date.localeCompare(a.date));
    });

    // 카테고리별 총액으로 그룹 정렬
    return Array.from(groups.entries())
      .map(([categoryId, txList]) => {
        const category = allCategories.find((c) => c.id === categoryId);
        return {
          categoryId,
          categoryName: getCategoryName(categoryId),
          categoryColor: category?.color,
          transactions: txList,
          totalAmount: txList.reduce((sum, tx) => sum + tx.amount, 0),
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions, allCategories]);

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAssetFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    assetFilter !== "all";

  const handleSelectTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
  };

  const handleTransactionDialogToggle = (open: boolean) => {
    if (!open) {
      setEditingTransaction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="거래 내역"
        action={
          <PeriodNavigator
            label={periodRange.label}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        }
      />

      {/* Period Selector */}
      <PeriodSelector value={periodMode} onChange={setPeriodMode} />

      {/* Summary KPI Cards */}
      <TransactionSummary stats={stats} />

      {/* Search and Filter Section */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="메모, 카테고리, 자산 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="거래 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 유형</SelectItem>
                <SelectItem value="INCOME">수입</SelectItem>
                <SelectItem value="EXPENSE">지출</SelectItem>
                <SelectItem value="TRANSFER">이체</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                {allCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger>
                <SelectValue placeholder="자산" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 자산</SelectItem>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground">
            {filteredTransactions.length}개의 거래 (전체{" "}
            {periodTransactions.length}개)
          </div>
        )}
      </div>

      {/* Category Grouped Transactions */}
      <div className="space-y-4">
        {groupedByCategory.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>거래 내역이 없습니다</p>
              <p className="text-sm mt-2">+ 버튼을 눌러 거래를 추가하세요</p>
            </CardContent>
          </Card>
        ) : (
          groupedByCategory.map((group, index) => (
            <CategoryGroup
              key={group.categoryId}
              categoryName={group.categoryName}
              categoryColor={group.categoryColor}
              transactions={group.transactions}
              totalAmount={group.totalAmount}
              getAccountName={getAccountName}
              onDelete={handleDelete}
              defaultExpanded={index < 3}
              onSelect={handleSelectTransaction}
            />
          ))
        )}
      </div>

      <TransactionForm
        addTransaction={addTransaction}
        updateTransaction={updateTransaction}
        deleteTransaction={deleteTransaction}
        assets={assets}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        creditCards={creditCards}
      />

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
