import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Repeat,
  CreditCard,
  List,
  BarChart3,
  MoreHorizontal,
  Settings,
  Bell,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import type { Asset, Category, CreditCard as CreditCardType, Transaction } from "@/types";

interface QuickActionsBarProps {
  assets: Asset[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  creditCards: CreditCardType[];
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export function QuickActionsBar({
  assets,
  incomeCategories,
  expenseCategories,
  creditCards,
  addTransaction,
  updateTransaction,
  deleteTransaction,
}: QuickActionsBarProps) {
  const navigate = useNavigate();
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const mainActions = [
    {
      icon: ArrowUpRight,
      label: "수입 입력",
      onClick: () => setIncomeDialogOpen(true),
      bgColor: "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700",
      textColor: "text-white",
      type: "income" as const,
    },
    {
      icon: ArrowDownRight,
      label: "지출 입력",
      onClick: () => setExpenseDialogOpen(true),
      bgColor: "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
      textColor: "text-white",
      type: "expense" as const,
    },
    {
      icon: Calendar,
      label: "캘린더",
      onClick: () => navigate("/calendar"),
      bgColor: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80",
      textColor: "text-foreground",
    },
    {
      icon: Repeat,
      label: "체리피커",
      onClick: () => navigate("/cherry-picker"),
      bgColor: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80",
      textColor: "text-foreground",
    },
    {
      icon: CreditCard,
      label: "카드",
      onClick: () => navigate("/cards"),
      bgColor: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80",
      textColor: "text-foreground",
    },
    {
      icon: List,
      label: "거래",
      onClick: () => navigate("/transactions"),
      bgColor: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80",
      textColor: "text-foreground",
    },
    {
      icon: BarChart3,
      label: "통계",
      onClick: () => navigate("/statistics"),
      bgColor: "bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80",
      textColor: "text-foreground",
    },
  ];

  return (
    <>
      {/* Desktop: Grid layout */}
      <div className="hidden lg:grid lg:grid-cols-8 gap-3">
        {mainActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 ${action.bgColor} ${action.textColor}`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm">{action.label}</span>
          </button>
        ))}

        {/* More Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md hover:scale-105 bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80 text-foreground">
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-sm">더보기</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              설정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Bell className="h-4 w-4 mr-2" />
              이벤트 관리
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              정기 거래 관리
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile/Tablet: Horizontal scrollable layout */}
      <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {mainActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex-shrink-0 ${action.bgColor} ${action.textColor}`}
          >
            <action.icon className="h-6 w-6" />
            <span className="text-sm whitespace-nowrap">{action.label}</span>
          </button>
        ))}

        {/* More Button with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium transition-all shadow-sm hover:shadow-md flex-shrink-0 bg-muted hover:bg-muted/80 dark:bg-muted dark:hover:bg-muted/80 text-foreground">
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-sm whitespace-nowrap">더보기</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              설정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Bell className="h-4 w-4 mr-2" />
              이벤트 관리
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              정기 거래 관리
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transaction Forms */}
      <TransactionForm
        hideTrigger
        autoOpen={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        defaultType="INCOME"
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
        autoOpen={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        defaultType="EXPENSE"
        addTransaction={addTransaction}
        updateTransaction={updateTransaction}
        deleteTransaction={deleteTransaction}
        assets={assets}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        creditCards={creditCards}
      />
    </>
  );
}

