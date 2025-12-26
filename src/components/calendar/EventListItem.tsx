import { Button } from "@/components/ui/button";
import { Calendar, Power, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { getDaysUntilEvent, getEventTypeLabel } from "@/lib/eventUtils";
import { cn } from "@/lib/utils";
import type { AnnualEvent } from "@/types";

interface EventListItemProps {
  event: AnnualEvent;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function EventListItem({
  event,
  onToggle,
  onDelete,
}: EventListItemProps) {
  const daysUntil = getDaysUntilEvent(event);

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg group hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            event.isActive
              ? "bg-pink-100 dark:bg-pink-900/30"
              : "bg-gray-100 dark:bg-gray-900/30"
          )}
        >
          <Calendar
            className={cn(
              "h-4 w-4",
              event.isActive
                ? "text-pink-600 dark:text-pink-400"
                : "text-gray-400"
            )}
          />
        </div>
        <div className="flex-1">
          <p className="font-medium">{event.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {event.month}월 {event.day}일
            </span>
            <span>·</span>
            <span>{getEventTypeLabel(event.type)}</span>
            {daysUntil >= 0 && daysUntil <= 30 && (
              <>
                <span>·</span>
                <span
                  className={cn(
                    "font-semibold",
                    daysUntil === 0
                      ? "text-pink-600 dark:text-pink-400"
                      : daysUntil <= 3
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-blue-600 dark:text-blue-400"
                  )}
                >
                  {daysUntil === 0 ? "오늘!" : `D-${daysUntil}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {event.amount && (
          <p className="text-sm font-semibold text-muted-foreground">
            {formatCurrency(event.amount)}
          </p>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(event.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title={event.isActive ? "비활성화" : "활성화"}
        >
          <Power
            className={cn(
              "h-4 w-4",
              event.isActive ? "text-green-600" : "text-gray-400"
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(event.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="삭제"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
