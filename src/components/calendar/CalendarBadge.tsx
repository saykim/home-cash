import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type BadgeVariant = "transaction" | "card" | "event" | "income" | "expense";

interface CalendarBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  tooltip?: string;
  className?: string;
  cardColor?: string; // For card variant
}

/**
 * Unified badge component for calendar items
 * Provides consistent styling across all badge types
 */
export function CalendarBadge({
  variant,
  children,
  tooltip,
  className,
  cardColor
}: CalendarBadgeProps) {
  const baseClass = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none";

  const variantClasses: Record<BadgeVariant, string> = {
    transaction: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    card: cn("text-white font-semibold", cardColor || "bg-gray-600"),
    event: "bg-pink-500 text-white",
    income: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    expense: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const badge = (
    <span className={cn(baseClass, variantClasses[variant], className)}>
      {children}
    </span>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

/**
 * Helper function to get card brand color
 * Matches the existing color scheme from CalendarPage
 */
export function getCardColor(cardName: string): string {
  const name = cardName.toLowerCase();
  if (name.includes("신한")) return "bg-blue-600";
  if (name.includes("국민") || name.includes("kb")) return "bg-amber-500";
  if (name.includes("삼성")) return "bg-indigo-600";
  if (name.includes("현대")) return "bg-emerald-600";
  if (name.includes("롯데")) return "bg-red-500";
  if (name.includes("우리")) return "bg-cyan-600";
  if (name.includes("하나")) return "bg-teal-600";
  if (name.includes("농협") || name.includes("nh")) return "bg-green-600";
  if (name.includes("카카오")) return "bg-yellow-500";
  if (name.includes("토스")) return "bg-blue-500";
  return "bg-gray-600";
}
