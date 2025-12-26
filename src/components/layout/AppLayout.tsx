import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, List, BarChart3, CreditCard, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';

const navItems = [
  { path: '/', icon: Home, label: '홈' },
  { path: '/transactions', icon: List, label: '거래' },
  { path: '/calendar', icon: Calendar, label: '캘린더' },
  { path: '/cherry-picker', icon: CreditCard, label: '체리피커' },
  { path: '/statistics', icon: BarChart3, label: '통계' }
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="md:pl-64">
        <div className="container max-w-[1600px] mx-auto px-6 lg:px-8 xl:px-12 py-8 pb-20 md:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t safe-bottom md:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 transition-colors touch-target',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
