'use client';

import { useCategories } from '@/hooks/useCategories';
import { useUiStore } from '@/store/uiStore';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const GROUP_LABELS: Record<string, string> = {
  market: '시장 유형',
  domain: '지식 영역',
  level: '경험 수준'
};

export function Sidebar() {
  const { data: categories, isLoading } = useCategories();
  const { selectedCategories, toggleCategory, clearCategories } = useUiStore();

  if (isLoading) {
    return (
      <aside className="w-64 shrink-0 hidden md:block">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </aside>
    );
  }

  const grouped: Record<string, any[]> = {};
  categories?.forEach((c: any) => {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  });

  return (
    <aside className="w-64 shrink-0 hidden md:block space-y-8 pr-6 border-r">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">카테고리 필터</h2>
        {selectedCategories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCategories} className="h-8 text-xs text-muted-foreground">
            초기화
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {['market', 'domain', 'level'].map(group => (
          grouped[group] && (
            <div key={group} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 flex items-center justify-between">
                {GROUP_LABELS[group] || group}
              </h3>
              <div className="flex flex-wrap gap-2">
                {grouped[group].map((category) => (
                  <CategoryBadge
                    key={category.id}
                    category={category}
                    selected={selectedCategories.includes(category.id)}
                    onClick={() => toggleCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </aside>
  );
}
