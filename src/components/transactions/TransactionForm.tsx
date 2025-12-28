import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import type { TransactionType, Transaction, Asset, Category, CreditCard } from "@/types";

interface TransactionFormProps {
  children?: React.ReactNode;
  hideTrigger?: boolean;
  defaultType?: TransactionType;
  defaultDate?: Date | null;
  editTransaction?: Transaction | null;
  onOpenChange?: (open: boolean) => void;
  autoOpen?: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  assets: Asset[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  creditCards: CreditCard[];
}

export function TransactionForm({
  children,
  hideTrigger = false,
  defaultType = "EXPENSE",
  defaultDate = null,
  editTransaction = null,
  onOpenChange,
  autoOpen = false,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  assets,
  incomeCategories,
  expenseCategories,
  creditCards,
}: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [assetId, setAssetId] = useState("");
  const [toAssetId, setToAssetId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [memo, setMemo] = useState("");

  const categories = type === "INCOME" ? incomeCategories : expenseCategories;
  const isEditMode = Boolean(editTransaction);

  // Reset or pre-fill form when dialog opens
  useEffect(() => {
    if (open) {
      if (editTransaction) {
        // Edit mode - pre-fill with existing transaction
        setType(editTransaction.type);
        setDate(editTransaction.date);
        setAmount(formatAmountInput(String(editTransaction.amount)));
        setAssetId(editTransaction.assetId);
        setToAssetId(editTransaction.toAssetId || "");
        setCategoryId(editTransaction.categoryId);
        setCardId(editTransaction.cardId || "");
        setMemo(editTransaction.memo || "");
      } else {
        // Add mode - reset to defaults
        setType(defaultType);
        if (defaultDate) {
          setDate(format(defaultDate, "yyyy-MM-dd"));
        } else {
          setDate(format(new Date(), "yyyy-MM-dd"));
        }
        setAmount("");
        setAssetId("");
        setToAssetId("");
        setCategoryId("");
        setCardId("");
        setMemo("");
      }
    }
  }, [open, editTransaction, defaultType, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !amount || !assetId) {
      alert("날짜, 금액, 자산을 모두 입력해주세요.");
      return;
    }

    if (type !== "TRANSFER" && !categoryId) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    if (type === "TRANSFER" && !toAssetId) {
      alert("이체 대상 자산을 선택해주세요.");
      return;
    }

    if (isEditMode && editTransaction) {
      // Edit mode - update existing transaction
      await updateTransaction(editTransaction.id, {
        date,
        type,
        amount: parseFormattedAmount(amount),
        assetId,
        toAssetId: type === "TRANSFER" ? toAssetId : undefined,
        categoryId: type !== "TRANSFER" ? categoryId : categories[0]?.id || "",
        cardId: cardId && cardId !== "NONE" ? cardId : undefined,
        memo,
      });
    } else {
      // Add mode - create new transaction
      await addTransaction({
        date,
        type,
        amount: parseFormattedAmount(amount),
        assetId,
        toAssetId: type === "TRANSFER" ? toAssetId : undefined,
        categoryId: type !== "TRANSFER" ? categoryId : categories[0]?.id || "",
        cardId: cardId && cardId !== "NONE" ? cardId : undefined,
        memo,
      });
    }

    handleClose();
  };

  const handleDelete = async () => {
    if (!editTransaction) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    await deleteTransaction(editTransaction.id);
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Use effect to sync external open state
  useEffect(() => {
    if (editTransaction) {
      setOpen(true);
    }
  }, [editTransaction]);

  // Auto-open when autoOpen is true
  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {children || (
            <Button className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:bottom-4 z-40">
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "거래 수정" : "거래 추가"}</DialogTitle>
          <DialogDescription className="sr-only">
            날짜, 금액, 자산과 카테고리(또는 이체 대상)를 입력해 거래를 저장합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="EXPENSE">지출</TabsTrigger>
              <TabsTrigger value="INCOME">수입</TabsTrigger>
              <TabsTrigger value="TRANSFER">이체</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="date">날짜</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="금액을 입력하세요"
                className="text-right pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                원
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset">
              {type === "TRANSFER" ? "출금 자산" : "자산"}
            </Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger id="asset">
                <SelectValue placeholder="자산 선택" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="toAsset">입금 자산</Label>
              <Select value={toAssetId} onValueChange={setToAssetId}>
                <SelectTrigger id="toAsset">
                  <SelectValue placeholder="입금 자산 선택" />
                </SelectTrigger>
                <SelectContent>
                  {assets
                    .filter((a) => a.id !== assetId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type !== "TRANSFER" && (
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "EXPENSE" && creditCards.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="card">카드 (선택)</Label>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger id="card">
                  <SelectValue placeholder="카드 미사용" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">카드 미사용</SelectItem>
                  {creditCards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모를 입력하세요"
            />
          </div>

          <div className="flex gap-2">
            {isEditMode && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                삭제
              </Button>
            )}
            <Button type="submit" className={isEditMode ? "flex-1" : "w-full"}>
              {isEditMode ? "수정" : "저장"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
