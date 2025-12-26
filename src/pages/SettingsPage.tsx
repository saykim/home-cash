import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAssets } from "@/hooks/useAssets";
import { useCategories } from "@/hooks/useCategories";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { useAnnualEvents } from "@/hooks/useAnnualEvents";
import { RecurringTransactionForm } from "@/components/transactions/RecurringTransactionForm";
import { AnnualEventForm } from "@/components/calendar/AnnualEventForm";
import { EventListItem } from "@/components/calendar/EventListItem";
import { formatCurrency } from "@/lib/formatters";
import { groupEventsByType, getEventTypeLabel } from "@/lib/eventUtils";
import {
  Wallet,
  Plus,
  Trash2,
  Repeat,
  Power,
  PowerOff,
  Calendar,
} from "lucide-react";
import { cn, formatAmountInput, parseFormattedAmount } from "@/lib/utils";
import type { AssetType, CategoryKind, EventType } from "@/types";

export default function SettingsPage() {
  const { assets, addAsset, deleteAsset } = useAssets();
  const { allCategories, addCategory, deleteCategory } = useCategories();
  const {
    recurringTransactions,
    deleteRecurringTransaction,
    toggleActiveStatus,
  } = useRecurringTransactions();
  const {
    annualEvents,
    deleteAnnualEvent,
    toggleActiveStatus: toggleEventStatus,
  } = useAnnualEvents();

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("BANK");
  const [assetBalance, setAssetBalance] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("EXPENSE");

  const handleAddAsset = async () => {
    if (!assetName || !assetBalance) {
      alert("자산명과 잔액을 입력해주세요.");
      return;
    }

    try {
      await addAsset({
        name: assetName,
        type: assetType,
        balance: parseFormattedAmount(assetBalance),
        initialBalance: parseFormattedAmount(assetBalance),
      });

      setAssetName("");
      setAssetBalance("");
      setAssetType("BANK");
      setAssetDialogOpen(false);
    } catch (err) {
      toast({
        title: "추가 실패",
        description:
          err instanceof Error
            ? err.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm("이 자산을 삭제하시겠습니까? 관련된 거래도 모두 삭제됩니다.")) {
      await deleteAsset(id);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName) {
      alert("카테고리명을 입력해주세요.");
      return;
    }

    const colors = [
      "#ef4444",
      "#f97316",
      "#eab308",
      "#22c55e",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    await addCategory({
      name: categoryName,
      kind: categoryKind,
      color: randomColor,
    });

    setCategoryName("");
    setCategoryKind("EXPENSE");
    setCategoryDialogOpen(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("이 카테고리를 삭제하시겠습니까?")) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          자산, 카테고리, 반복 거래 및 연례 이벤트 관리
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Assets & Categories (7 columns) */}
        <div className="col-span-7 space-y-6">
          {/* Assets Management */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  자산 관리
                </CardTitle>
                <Dialog
                  open={assetDialogOpen}
                  onOpenChange={setAssetDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>자산 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="asset-name">자산명</Label>
                        <Input
                          id="asset-name"
                          value={assetName}
                          onChange={(e) => setAssetName(e.target.value)}
                          placeholder="예: 신한은행 주거래 통장"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="asset-type">유형</Label>
                        <Select
                          value={assetType}
                          onValueChange={(v) => setAssetType(v as AssetType)}
                        >
                          <SelectTrigger id="asset-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BANK">계좌</SelectItem>
                            <SelectItem value="CASH">현금</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="asset-balance">초기 잔액</Label>
                        <Input
                          id="asset-balance"
                          type="text"
                          inputMode="numeric"
                          value={assetBalance}
                          onChange={(e) =>
                            setAssetBalance(formatAmountInput(e.target.value))
                          }
                          placeholder="0"
                          className="text-right"
                        />
                      </div>
                      <Button onClick={handleAddAsset} className="w-full">
                        저장
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                        <th className="text-right py-4 px-5 text-sm font-medium text-muted-foreground w-16"></th>
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
                          <td className="py-4 px-5 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  카테고리 관리
                </CardTitle>
                <Dialog
                  open={categoryDialogOpen}
                  onOpenChange={setCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>카테고리 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">카테고리명</Label>
                        <Input
                          id="category-name"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="예: 교육비"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-kind">유형</Label>
                        <Select
                          value={categoryKind}
                          onValueChange={(v) =>
                            setCategoryKind(v as CategoryKind)
                          }
                        >
                          <SelectTrigger id="category-kind">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCOME">수입</SelectItem>
                            <SelectItem value="EXPENSE">지출</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddCategory} className="w-full">
                        저장
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* Income Categories */}
                <div className="p-5">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    수입
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allCategories
                      .filter((c) => c.kind === "INCOME")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2.5 border rounded-lg group hover:bg-muted/30 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">
                              {category.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Expense Categories */}
                <div className="p-5">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    지출
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allCategories
                      .filter((c) => c.kind === "EXPENSE")
                      .map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-2.5 border rounded-lg group hover:bg-muted/30 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">
                              {category.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Recurring & Events (5 columns) */}
        <div className="col-span-5 space-y-6">
          {/* Recurring Transactions Management */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  반복 거래
                </CardTitle>
                <RecurringTransactionForm />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {recurringTransactions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Repeat className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">등록된 반복 거래가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recurringTransactions.map((recurring) => (
                    <div
                      key={recurring.id}
                      className="flex items-center justify-between p-3 border rounded-lg group hover:bg-muted/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <div
                          className={cn(
                            "p-1.5 rounded-lg",
                            recurring.isActive
                              ? "bg-green-100 dark:bg-green-900/30"
                              : "bg-gray-100 dark:bg-gray-900/30"
                          )}
                        >
                          <Repeat
                            className={cn(
                              "h-3.5 w-3.5",
                              recurring.isActive
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-600 dark:text-gray-400"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {recurring.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(recurring.amount)} ·
                            {recurring.frequency === "DAILY" && " 매일"}
                            {recurring.frequency === "WEEKLY" && " 매주"}
                            {recurring.frequency === "MONTHLY" &&
                              ` 매월 ${recurring.dayOfMonth}일`}
                            {recurring.frequency === "YEARLY" && " 매년"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActiveStatus(recurring.id)}
                          title={recurring.isActive ? "비활성화" : "활성화"}
                        >
                          {recurring.isActive ? (
                            <Power className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <PowerOff className="h-3.5 w-3.5 text-gray-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("이 반복 거래를 삭제하시겠습니까?")) {
                              deleteRecurringTransaction(recurring.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Annual Events Management */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  연례 이벤트
                </CardTitle>
                <AnnualEventForm />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {annualEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">등록된 이벤트가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupEventsByType(annualEvents)).map(
                    ([type, events]) => (
                      <div key={type}>
                        <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                          {getEventTypeLabel(type as EventType)}
                        </h3>
                        <div className="space-y-1.5">
                          {events.map((event) => (
                            <EventListItem
                              key={event.id}
                              event={event}
                              onToggle={toggleEventStatus}
                              onDelete={(id) => {
                                if (confirm("이 이벤트를 삭제하시겠습니까?")) {
                                  deleteAnnualEvent(id);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">앱 정보</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">버전</span>
                  <span className="font-medium">0.0.1</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t">
                  <span className="text-muted-foreground">개발</span>
                  <span className="font-medium">Smart Ledger Team</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
