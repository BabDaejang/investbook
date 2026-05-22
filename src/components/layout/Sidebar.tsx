'use client';

import { useCategories } from '@/hooks/useCategories';
import { useUiStore } from '@/store/uiStore';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GROUP_LABELS: Record<string, string> = {
  market: '시장 유형',
  domain: '지식 영역',
  level: '경험 수준'
};

export function Sidebar() {
  const { data: categories, isLoading } = useCategories();
  const { selectedCategories, toggleCategory, clearCategories, isLeftSidebarOpen } = useUiStore();

  if (isLoading) {
    return (
      <aside className={cn(
        "shrink-0 hidden md:block transition-all duration-300 ease-in-out overflow-hidden",
        isLeftSidebarOpen ? "w-64 pr-6 opacity-100" : "w-0 p-0 border-r-0 opacity-0"
      )}>
        <div className="w-64 space-y-6">
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
    <aside className={cn(
      "shrink-0 hidden md:block border-r transition-all duration-300 ease-in-out overflow-hidden",
      isLeftSidebarOpen ? "w-64 pr-6 opacity-100" : "w-0 p-0 border-r-0 opacity-0 pointer-events-none"
    )}>
      {/* 내부 콘텐츠의 고정폭을 보장하여 찌그러짐 현상 방지 */}
      <div className="w-[230px] space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">카테고리 필터</h2>
          {selectedCategories.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCategories} className="h-8 text-xs text-muted-foreground hover:bg-slate-100 rounded-md">
              초기화
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {['market', 'domain', 'level'].map(group => (
            grouped[group] && (
              <div key={group} className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400 flex items-center justify-between uppercase tracking-wider">
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
      </div>
    </aside>
  );
}
