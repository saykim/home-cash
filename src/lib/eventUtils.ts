import { differenceInDays } from 'date-fns';
import type { AnnualEvent, EventType } from '@/types';

/**
 * Calculate next occurrence of an annual event
 * 올해 날짜가 이미 지났으면 내년 날짜 반환
 */
export function getNextOccurrence(event: AnnualEvent): Date {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Try this year first
  const thisYearDate = new Date(currentYear, event.month - 1, event.day);

  // If date hasn't passed, return this year's date
  if (thisYearDate >= today) {
    return thisYearDate;
  }

  // Otherwise, return next year's date
  return new Date(currentYear + 1, event.month - 1, event.day);
}

/**
 * Get days until next occurrence
 */
export function getDaysUntilEvent(event: AnnualEvent): number {
  const nextDate = getNextOccurrence(event);
  return differenceInDays(nextDate, new Date());
}

/**
 * Get event type label in Korean
 */
export function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    BIRTHDAY: '생일',
    CELEBRATION: '경조사(축하)',
    CONDOLENCE: '경조사(조의)',
    ANNIVERSARY: '기념일',
    OTHER: '기타'
  };
  return labels[type];
}

/**
 * Get event type abbreviation for badges
 */
export function getEventTypeAbbreviation(type: EventType): string {
  const abbr: Record<EventType, string> = {
    BIRTHDAY: '생일',
    CELEBRATION: '축하',
    CONDOLENCE: '조의',
    ANNIVERSARY: '기념',
    OTHER: '기타'
  };
  return abbr[type];
}

/**
 * Get badge color class for event type
 */
export function getEventBadgeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    BIRTHDAY: 'bg-pink-500 text-white',
    CELEBRATION: 'bg-amber-500 text-white',
    CONDOLENCE: 'bg-gray-500 text-white',
    ANNIVERSARY: 'bg-purple-500 text-white',
    OTHER: 'bg-blue-500 text-white'
  };
  return colors[type];
}

/**
 * Calculate age/years if firstYear is provided
 */
export function calculateYears(event: AnnualEvent): number | null {
  if (!event.firstYear) return null;
  const nextDate = getNextOccurrence(event);
  return nextDate.getFullYear() - event.firstYear + 1;
}

/**
 * Group events by type for display
 */
export function groupEventsByType(events: AnnualEvent[]): Record<EventType, AnnualEvent[]> {
  return events.reduce((acc, event) => {
    if (!acc[event.type]) acc[event.type] = [];
    acc[event.type].push(event);
    return acc;
  }, {} as Record<EventType, AnnualEvent[]>);
}

