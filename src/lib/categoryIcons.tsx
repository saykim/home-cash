import {
  Utensils,
  Coffee,
  ShoppingCart,
  Car,
  Bus,
  Home,
  Zap,
  Smartphone,
  Heart,
  Shirt,
  GraduationCap,
  Plane,
  Gift,
  Briefcase,
  DollarSign,
  TrendingUp,
  Wallet,
  type LucideIcon
} from 'lucide-react';

// Category name to icon mapping
const categoryIconMap: Record<string, LucideIcon> = {
  // 식비
  '식비': Utensils,
  '외식': Utensils,
  '식사': Utensils,
  '음식': Utensils,
  '카페': Coffee,
  '커피': Coffee,

  // 쇼핑
  '쇼핑': ShoppingCart,
  '마트': ShoppingCart,
  '생활용품': ShoppingCart,
  '의류': Shirt,
  '패션': Shirt,

  // 교통
  '교통': Car,
  '차량': Car,
  '주유': Car,
  '대중교통': Bus,
  '버스': Bus,
  '지하철': Bus,
  '택시': Car,

  // 주거
  '주거': Home,
  '월세': Home,
  '관리비': Home,
  '공과금': Zap,
  '전기': Zap,
  '가스': Zap,
  '수도': Zap,

  // 통신
  '통신': Smartphone,
  '휴대폰': Smartphone,
  '인터넷': Smartphone,

  // 의료
  '의료': Heart,
  '병원': Heart,
  '약국': Heart,
  '건강': Heart,

  // 교육
  '교육': GraduationCap,
  '학원': GraduationCap,
  '도서': GraduationCap,

  // 여행
  '여행': Plane,
  '숙박': Plane,

  // 경조사
  '경조사': Gift,
  '선물': Gift,

  // 수입
  '급여': Briefcase,
  '월급': Briefcase,
  '보너스': DollarSign,
  '용돈': DollarSign,
  '이자': TrendingUp,
  '배당': TrendingUp,

  // 기타
  '기타': Wallet,
};

export function getCategoryIcon(categoryName: string): LucideIcon | null {
  // Exact match first
  if (categoryIconMap[categoryName]) {
    return categoryIconMap[categoryName];
  }

  // Partial match
  for (const [key, icon] of Object.entries(categoryIconMap)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return icon;
    }
  }

  return null;
}

export function getTopCategoryIcon(transactions: any[], allCategories: any[]): LucideIcon | null {
  if (transactions.length === 0) return null;

  // Count transactions by category
  const categoryCount = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.type !== 'TRANSFER') {
      const count = categoryCount.get(tx.categoryId) || 0;
      categoryCount.set(tx.categoryId, count + 1);
    }
  });

  // Find most frequent category
  let maxCount = 0;
  let topCategoryId = '';
  categoryCount.forEach((count, categoryId) => {
    if (count > maxCount) {
      maxCount = count;
      topCategoryId = categoryId;
    }
  });

  if (!topCategoryId) return null;

  // Get category name and find icon
  const category = allCategories.find(c => c.id === topCategoryId);
  if (!category) return null;

  return getCategoryIcon(category.name);
}
