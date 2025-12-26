import type { CreditCard } from '@/types';

const DEFAULT_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-cyan-500',
];

/**
 * 카드 ID 기반으로 일관된 색상 반환
 */
export function getCardColor(card: CreditCard): string {
  const hash = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_COLORS[hash % DEFAULT_COLORS.length];
}

/**
 * 카드명에서 약자 추출
 * 예: "삼성카드" → "삼성", "국민카드" → "국민", "KB국민" → "KB"
 */
export function getCardAbbreviation(cardName: string, maxLength: number = 2): string {
  if (!cardName) return '';

  // 한글 우선 추출
  const koreanRegex = /[\uAC00-\uD7AF]+/g;
  const koreanMatches = cardName.match(koreanRegex);

  if (koreanMatches && koreanMatches[0]) {
    const korean = koreanMatches[0];
    // "카드" 제거
    const withoutCard = korean.replace(/카드/g, '');
    if (withoutCard.length > 0) {
      return withoutCard.slice(0, maxLength);
    }
    return korean.slice(0, maxLength);
  }

  // 영문 처리
  const englishRegex = /[A-Za-z]+/g;
  const englishMatches = cardName.match(englishRegex);

  if (englishMatches && englishMatches[0]) {
    return englishMatches[0].slice(0, maxLength).toUpperCase();
  }

  // 기타: 처음 n글자
  return cardName.slice(0, maxLength);
}
