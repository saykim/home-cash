import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-12">
      <div className="text-center text-muted-foreground">
        {icon && <div className="flex justify-center mb-4 opacity-20">{icon}</div>}
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm mt-2">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
