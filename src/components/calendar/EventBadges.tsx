import { cn } from '@/lib/utils';
import { getEventBadgeColor, getEventTypeAbbreviation } from '@/lib/eventUtils';
import type { AnnualEvent } from '@/types';

interface EventBadgesProps {
  events: AnnualEvent[];
  isSelected: boolean;
  maxVisible?: number;
}

export function EventBadges({
  events,
  isSelected,
  maxVisible = 2
}: EventBadgesProps) {
  if (events.length === 0) return null;

  const visibleEvents = events.slice(0, maxVisible);
  const remainingCount = events.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center justify-center gap-0.5 px-1">
      {visibleEvents.map((event) => {
        const abbreviation = getEventTypeAbbreviation(event.type);
        const colorClass = getEventBadgeColor(event.type);

        return (
          <span
            key={event.id}
            className={cn(
              'inline-flex items-center justify-center px-1.5 py-0.5 rounded font-medium transition-all duration-200',
              'text-[10px] leading-tight',
              'md:text-xs',
              colorClass,
              isSelected && 'ring-1 ring-white/50',
              'hover:opacity-90 hover:scale-105'
            )}
            title={event.name}
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
          title={`외 ${remainingCount}개 이벤트`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
