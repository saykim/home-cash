import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import type { Asset, AssetType } from "@/types";

interface AssetManagerDialogProps {
  assets: Asset[];
  addAsset: (asset: Omit<Asset, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  children?: ReactNode;
}

interface FormState {
  name: string;
  type: AssetType;
  balance: string;
}

const defaultFormState: FormState = {
  name: "",
  type: "BANK",
  balance: "",
};

export function AssetManagerDialog({
  assets,
  addAsset,
  updateAsset,
  deleteAsset,
  children,
}: AssetManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingId);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const resetForm = () => {
    setForm(defaultFormState);
    setEditingId(null);
    setSubmitting(false);
  };

  const handleEditClick = (asset: Asset) => {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      type: asset.type,
      balance: formatAmountInput(String(asset.balance)),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 자산을 삭제하시겠습니까? 관련된 거래도 모두 삭제됩니다.")) {
      return;
    }
    try {
      await deleteAsset(id);
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "자산 삭제에 실패했습니다.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.balance) {
      alert("자산명과 잔액을 입력해주세요.");
      return;
    }

    const parsedBalance = parseFormattedAmount(form.balance);
    if (Number.isNaN(parsedBalance)) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        const target = assets.find((asset) => asset.id === editingId);
        await updateAsset(editingId, {
          name: form.name,
          type: form.type,
          balance: parsedBalance,
          initialBalance: target?.initialBalance ?? parsedBalance,
        });
      } else {
        await addAsset({
          name: form.name,
          type: form.type,
          balance: parsedBalance,
          initialBalance: parsedBalance,
        });
      }
      resetForm();
    } catch (error) {
      alert(error instanceof Error ? error.message : "자산 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            관리
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>자산 {isEditing ? "수정" : "관리"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">등록된 자산</h4>
            {assets.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground border rounded-lg">
                등록된 자산이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/40"
                  >
                    <div>
                      <p className="font-semibold">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type === "BANK" ? "계좌" : "현금"} · {formatCurrency(asset.balance)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(asset)}>
                        편집
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(asset.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">
              {isEditing ? "자산 정보 수정" : "새 자산 추가"}
            </h4>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="asset-name-manage">자산명</Label>
                <Input
                  id="asset-name-manage"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="예: 주거래 통장"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-type-manage">유형</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as AssetType }))}
                >
                  <SelectTrigger id="asset-type-manage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK">계좌</SelectItem>
                    <SelectItem value="CASH">현금</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset-balance-manage">잔액</Label>
                <Input
                  id="asset-balance-manage"
                  type="text"
                  inputMode="numeric"
                  value={form.balance}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, balance: formatAmountInput(e.target.value) }))
                  }
                  placeholder="0"
                  className="text-right"
                />
              </div>

              <div className="flex justify-end gap-2">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={submitting}>
                    취소
                  </Button>
                )}
                <Button type="submit" disabled={submitting} className="min-w-[120px]">
                  {isEditing ? "수정 저장" : "추가"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

