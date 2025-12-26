import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnnualEvents } from "@/hooks/useAnnualEvents";
import { formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import type { EventType, AnnualEvent } from "@/types";

interface AnnualEventFormProps {
  children?: React.ReactNode;
  editEvent?: AnnualEvent | null;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (payload: { month: number; day: number }) => void;
}

export function AnnualEventForm({
  children,
  editEvent = null,
  onOpenChange,
  onSaved,
}: AnnualEventFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<EventType>("BIRTHDAY");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [amount, setAmount] = useState("");
  const [firstYear, setFirstYear] = useState("");
  const [memo, setMemo] = useState("");

  const { addAnnualEvent, updateAnnualEvent, deleteAnnualEvent } =
    useAnnualEvents();
  const isEditMode = Boolean(editEvent);

  // Calculate maximum days in selected month (use 2024 as reference for leap year)
  const maxDaysInMonth = new Date(2024, month, 0).getDate();

  // Adjust day if it exceeds max days in selected month
  useEffect(() => {
    if (day > maxDaysInMonth) {
      setDay(maxDaysInMonth);
    }
  }, [month, maxDaysInMonth]);

  // Pre-fill form when editing or reset when adding
  useEffect(() => {
    if (open) {
      if (editEvent) {
        // Edit mode - pre-fill with existing event
        setName(editEvent.name);
        setType(editEvent.type);
        setMonth(editEvent.month);
        setDay(editEvent.day);
        setAmount(
          editEvent.amount ? formatAmountInput(String(editEvent.amount)) : ""
        );
        setFirstYear(editEvent.firstYear ? String(editEvent.firstYear) : "");
        setMemo(editEvent.memo || "");
      } else {
        // Add mode - reset to defaults
        setName("");
        setType("BIRTHDAY");
        setMonth(1);
        setDay(1);
        setAmount("");
        setFirstYear("");
        setMemo("");
      }
    }
  }, [open, editEvent]);

  // Sync external open state
  useEffect(() => {
    if (editEvent) {
      setOpen(true);
    }
  }, [editEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("이벤트명을 입력해주세요.");
      return;
    }

    // Validate date
    if (day > maxDaysInMonth) {
      alert(`${month}월은 최대 ${maxDaysInMonth}일까지 있습니다.`);
      return;
    }

    const eventData = {
      name: name.trim(),
      type,
      month,
      day,
      amount: amount ? parseFormattedAmount(amount) : undefined,
      firstYear: firstYear ? Number(firstYear) : undefined,
      memo: memo.trim() || undefined,
      isActive: true,
    };

    if (isEditMode && editEvent) {
      // Edit mode - update existing event
      await updateAnnualEvent(editEvent.id, eventData);
    } else {
      // Add mode - create new event
      await addAnnualEvent(eventData);
    }

    onSaved?.({ month, day });
    handleClose();
  };

  const handleDelete = async () => {
    if (!editEvent) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    await deleteAnnualEvent(editEvent.id);
    onSaved?.({ month: editEvent.month, day: editEvent.day });
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            이벤트 추가
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "연례 이벤트 수정" : "연례 이벤트 추가"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            이벤트명, 종류, 날짜와 선택 항목(예산 금액/첫 발생 연도/메모)을 입력해 연례 이벤트를 저장합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="name">이벤트명 *</Label>
            <Input
              id="name"
              placeholder="예: 엄마 생일"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="type">이벤트 종류 *</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BIRTHDAY">생일</SelectItem>
                <SelectItem value="CELEBRATION">경조사(축하)</SelectItem>
                <SelectItem value="CONDOLENCE">경조사(조의)</SelectItem>
                <SelectItem value="ANNIVERSARY">기념일</SelectItem>
                <SelectItem value="OTHER">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month and Day */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">월 *</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
              >
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">일 *</Label>
              <Select
                value={String(day)}
                onValueChange={(v) => setDay(Number(v))}
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map(
                    (d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}일
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {month}월은 {maxDaysInMonth}일까지
              </p>
            </div>
          </div>

          {/* Amount (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="amount">예산 금액 (선택)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="numeric"
              placeholder="예: 50,000"
              value={amount}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              생일 선물, 경조사비 등의 예상 금액
            </p>
          </div>

          {/* First Year (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="firstYear">첫 발생 연도 (선택)</Label>
            <Input
              id="firstYear"
              type="number"
              placeholder="예: 1990"
              value={firstYear}
              onChange={(e) => setFirstYear(e.target.value)}
              min="1900"
              max={new Date().getFullYear()}
            />
            <p className="text-xs text-muted-foreground">
              생일의 경우 출생 연도 입력 시 회차 표시 (예: 35회 생일)
            </p>
          </div>

          {/* Memo (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="memo">메모 (선택)</Label>
            <Textarea
              id="memo"
              placeholder="추가 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              취소
            </Button>
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
            <Button type="submit" className="flex-1">
              {isEditMode ? "수정" : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
