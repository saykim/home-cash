import { cn } from '@/lib/utils';
import { getCardColor, getCardAbbreviation } from '@/lib/cardColors';
import type { CreditCard } from '@/types';

interface BillingDayBadgesProps {
  billingCards: CreditCard[];
  isSelected: boolean;
  maxVisibleCards?: number;
}

export function BillingDayBadges({
  billingCards,
  isSelected,
  maxVisibleCards = 3
}: BillingDayBadgesProps) {
  if (billingCards.length === 0) return null;

  const visibleCards = billingCards.slice(0, maxVisibleCards);
  const remainingCount = billingCards.length - maxVisibleCards;

  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5 px-1">
      {visibleCards.map((card) => {
        const abbreviation = getCardAbbreviation(card.name, 2);
        const colorClass = getCardColor(card);

        return (
          <span
            key={card.id}
            className={cn(
              'inline-flex items-center justify-center px-1.5 py-0.5 rounded text-white font-medium transition-all duration-200',
              'text-[10px] leading-tight',
              'md:text-xs',
              colorClass,
              isSelected && 'ring-1 ring-white/50',
              'hover:opacity-90 hover:scale-105'
            )}
            title={`${card.name} 결제일`}
          >
            {abbreviation}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center px-1.5 py-0.5 rounded font-medium transition-all',
            'text-[10px] leading-tight',
            'md:text-xs',
            isSelected ? 'bg-white/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
          title={`외 ${remainingCount}개 카드`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
