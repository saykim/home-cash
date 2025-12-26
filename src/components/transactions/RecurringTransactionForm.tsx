import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { useAssets } from "@/hooks/useAssets";
import { useCategories } from "@/hooks/useCategories";
import { formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import { Plus, Repeat } from "lucide-react";
import type { TransactionType, RecurringFrequency } from "@/types";

export function RecurringTransactionForm() {
  const { addRecurringTransaction } = useRecurringTransactions();
  const { assets } = useAssets();
  const { incomeCategories, expenseCategories } = useCategories();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [assetId, setAssetId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [memo, setMemo] = useState("");

  const handleSubmit = async () => {
    if (!name || !amount || !assetId || !categoryId) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }

    await addRecurringTransaction({
      name,
      type,
      amount: parseFormattedAmount(amount),
      assetId,
      categoryId,
      frequency,
      startDate,
      dayOfMonth: frequency === "MONTHLY" ? Number(dayOfMonth) : undefined,
      isActive: true,
      memo,
    });

    // Reset form
    setName("");
    setAmount("");
    setAssetId("");
    setCategoryId("");
    setFrequency("MONTHLY");
    setDayOfMonth("1");
    setMemo("");
    setOpen(false);
  };

  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          반복 거래 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            반복 거래 등록
          </DialogTitle>
          <DialogDescription className="sr-only">
            반복 거래명, 유형, 금액, 자산, 카테고리, 주기와 시작일을 입력해 반복 거래를 등록합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">거래명 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 월세, 넷플릭스 구독료"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="type">유형 *</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as TransactionType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">수입</SelectItem>
                  <SelectItem value="EXPENSE">지출</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">금액 *</Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset">자산 *</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger id="asset">
                <SelectValue placeholder="자산 선택" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="frequency">반복 주기 *</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurringFrequency)}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">매일</SelectItem>
                  <SelectItem value="WEEKLY">매주</SelectItem>
                  <SelectItem value="MONTHLY">매월</SelectItem>
                  <SelectItem value="YEARLY">매년</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "MONTHLY" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">매월 일자</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">시작일 *</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Input
              id="memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="선택사항"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
