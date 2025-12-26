import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateStr: string, pattern = 'yyyy.MM.dd'): string {
  return format(parseISO(dateStr), pattern, { locale: ko });
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return format(date, 'M월 d일', { locale: ko });
}
