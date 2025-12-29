/**
 * 표준 레이아웃 패턴
 * 일관된 그리드 시스템과 간격을 위한 상수
 */

export const LAYOUTS = {
  /** 2열 그리드: 모바일 1열, 데스크톱 2열 */
  twoColumn: 'grid grid-cols-1 lg:grid-cols-2 gap-6',

  /** 3열 그리드: 모바일 1열, 태블릿 2열, 데스크톱 3열 */
  threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',

  /** 대시보드 그리드: 12열 기반 유연한 레이아웃 */
  dashboard: 'grid grid-cols-1 lg:grid-cols-12 gap-4',
} as const;

export const SPACING = {
  /** 섹션 간 수직 간격 */
  section: 'space-y-6',

  /** 카드 그리드 간격 */
  cardGap: 'gap-6',

  /** 작은 간격 */
  small: 'gap-4',
} as const;

/**
 * 표준 컴포넌트 크기
 */
export const SIZES = {
  /** 월/기간 네비게이터 최소 너비 */
  monthNavigator: 'min-w-[140px]',

  /** 터치 타겟 최소 크기 (접근성) */
  touchTarget: 'min-h-[44px] min-w-[44px]',
} as const;
