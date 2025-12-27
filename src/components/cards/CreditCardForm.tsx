import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAssets } from '@/hooks/useAssets';
import type { CreditCard } from '@/types';

interface CreditCardFormProps {
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function CreditCardForm({ addCreditCard }: CreditCardFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [billingDay, setBillingDay] = useState('25');
  const [startOffset, setStartOffset] = useState('-1');
  const [startDay, setStartDay] = useState('1');
  const [endOffset, setEndOffset] = useState('0');
  const [endDay, setEndDay] = useState('31');
  const [linkedAssetId, setLinkedAssetId] = useState('');

  const { assets } = useAssets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !linkedAssetId) {
      alert('카드명과 연결 자산을 모두 입력해주세요.');
      return;
    }

    await addCreditCard({
      name,
      billingDay: Number(billingDay),
      startOffset: Number(startOffset),
      startDay: Number(startDay),
      endOffset: Number(endOffset),
      endDay: Number(endDay),
      linkedAssetId
    });

    // Reset form
    setName('');
    setBillingDay('25');
    setStartOffset('-1');
    setStartDay('1');
    setEndOffset('0');
    setEndDay('31');
    setLinkedAssetId('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          카드 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>신용카드 추가</DialogTitle>
          <DialogDescription className="sr-only">
            카드명과 결제일, 이용 기간, 연결 자산을 입력해 신용카드를 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-name">카드명</Label>
            <Input
              id="card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 신한 Deep Dream"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing-day">결제일</Label>
            <Select value={billingDay} onValueChange={setBillingDay}>
              <SelectTrigger id="billing-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    매월 {day}일
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>이용 기간 시작</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={startOffset} onValueChange={setStartOffset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">전월</SelectItem>
                  <SelectItem value="0">당월</SelectItem>
                </SelectContent>
              </Select>
              <Select value={startDay} onValueChange={setStartDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {day}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>이용 기간 종료</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={endOffset} onValueChange={setEndOffset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">전월</SelectItem>
                  <SelectItem value="0">당월</SelectItem>
                </SelectContent>
              </Select>
              <Select value={endDay} onValueChange={setEndDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {day}일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linked-asset">연결 자산 (결제 계좌)</Label>
            <Select value={linkedAssetId} onValueChange={setLinkedAssetId}>
              <SelectTrigger id="linked-asset">
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

          <Button type="submit" className="w-full">
            저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
