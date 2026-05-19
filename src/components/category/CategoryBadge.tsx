import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: {
    id: string;
    name: string;
    color: string;
  };
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function CategoryBadge({ category, className, onClick, selected }: CategoryBadgeProps) {
  const color = category.color || '#6B7280';
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "transition-colors whitespace-nowrap",
        onClick && "cursor-pointer hover:brightness-95",
        selected && "ring-2 ring-offset-1",
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}40`,
        ...(selected ? { '--tw-ring-color': color } as any : {})
      }}
      onClick={onClick}
    >
      {category.name}
    </Badge>
  );
}
