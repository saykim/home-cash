import { Link, useLocation } from 'react-router-dom';
import { Home, List, BarChart3, CreditCard, Settings, Wallet, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/transactions', icon: List, label: '거래' },
  { path: '/calendar', icon: Calendar, label: '캘린더' },
  { path: '/budget', icon: TrendingUp, label: '예산' },
  { path: '/cherry-picker', icon: CreditCard, label: '체리피커' },
  { path: '/statistics', icon: BarChart3, label: '통계' },
  { path: '/cards', icon: Wallet, label: '카드' },
  { path: '/settings', icon: Settings, label: '설정' }
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 md:border-r md:bg-card z-50">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          <h1 className="text-xl font-bold">Smart Ledger</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
