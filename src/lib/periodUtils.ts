import {
  format,
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subDays, subWeeks, subMonths,
  addDays, addWeeks, addMonths
} from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PeriodMode, PeriodRange } from '@/types';

/**
 * 선택한 모드와 날짜에 따른 기간 범위 반환
 */
export function getPeriodRange(mode: PeriodMode, date: Date): PeriodRange {
  let start: Date;
  let end: Date;
  let label: string;

  switch (mode) {
    case 'day':
      start = startOfDay(date);
      end = endOfDay(date);
      label = format(date, 'yyyy.MM.dd (eee)', { locale: ko });
      break;

    case 'week':
      // 월요일 시작 주 (date-fns 기본은 일요일)
      start = startOfWeek(date, { weekStartsOn: 1, locale: ko });
      end = endOfWeek(date, { weekStartsOn: 1, locale: ko });
      const weekNum = Math.ceil(date.getDate() / 7);
      label = `${format(date, 'yyyy년 M월', { locale: ko })} ${weekNum}주`;
      break;

    case 'month':
      start = startOfMonth(date);
      end = endOfMonth(date);
      label = format(date, 'yyyy년 M월', { locale: ko });
      break;
  }

  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
    label
  };
}

/**
 * 이전 기간 계산
 */
export function getPreviousPeriod(mode: PeriodMode, date: Date): Date {
  switch (mode) {
    case 'day':
      return subDays(date, 1);
    case 'week':
      return subWeeks(date, 1);
    case 'month':
      return subMonths(date, 1);
  }
}

/**
 * 다음 기간 계산
 */
export function getNextPeriod(mode: PeriodMode, date: Date): Date {
  switch (mode) {
    case 'day':
      return addDays(date, 1);
    case 'week':
      return addWeeks(date, 1);
    case 'month':
      return addMonths(date, 1);
  }
}

/**
 * 증감률 계산
 */
export function calculateChangeRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * 트렌드 차트용 기간 배열 생성
 * 일: 최근 30일, 주: 최근 12주, 월: 최근 6개월
 */
export function getTrendPeriods(mode: PeriodMode, endDate: Date): Date[] {
  const periods: Date[] = [];

  switch (mode) {
    case 'day':
      for (let i = 29; i >= 0; i--) {
        periods.push(subDays(endDate, i));
      }
      break;

    case 'week':
      for (let i = 11; i >= 0; i--) {
        periods.push(subWeeks(endDate, i));
      }
      break;

    case 'month':
      for (let i = 5; i >= 0; i--) {
        periods.push(subMonths(endDate, i));
      }
      break;
  }

  return periods;
}

/**
 * 트렌드 차트 라벨 포맷
 */
export function formatTrendLabel(mode: PeriodMode, date: Date): string {
  switch (mode) {
    case 'day':
      return format(date, 'M/d', { locale: ko });
    case 'week':
      const weekNum = Math.ceil(date.getDate() / 7);
      return `${format(date, 'M월', { locale: ko })}${weekNum}주`;
    case 'month':
      return format(date, 'M월', { locale: ko });
  }
}
