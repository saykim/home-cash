import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PeriodMode } from '@/types';

interface PeriodSelectorProps {
  value: PeriodMode;
  onChange: (mode: PeriodMode) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PeriodMode)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="day">일</TabsTrigger>
        <TabsTrigger value="week">주</TabsTrigger>
        <TabsTrigger value="month">월</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
