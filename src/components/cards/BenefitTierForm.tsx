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
import type { BenefitTier } from '@/types';

interface BenefitTierFormProps {
  cardId: string;
  addBenefitTier: (tier: Omit<BenefitTier, 'id' | 'createdAt'>) => Promise<void>;
}

export function BenefitTierForm({ cardId, addBenefitTier }: BenefitTierFormProps) {
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!threshold || !description) {
      alert('실적 금액과 혜택 설명을 모두 입력해주세요.');
      return;
    }

    await addBenefitTier({
      cardId,
      threshold: Number(threshold),
      description
    });

    setThreshold('');
    setDescription('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7" title="혜택 추가">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>카드 혜택 추가</DialogTitle>
          <DialogDescription className="sr-only">
            실적 금액과 혜택 설명을 입력해 카드 혜택 구간을 추가합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">실적 금액 (원)</Label>
            <Input
              id="threshold"
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="예: 300000"
            />
            <p className="text-xs text-muted-foreground">이 금액 이상 사용 시 혜택 적용</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">혜택 설명</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 스타벅스 1만원 할인"
            />
          </div>

          <Button type="submit" className="w-full">
            저장
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
