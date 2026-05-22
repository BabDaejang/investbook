'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useUiStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, ChevronDown, ChevronRight,
  Library, BookMarked, PanelLeft
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GROUP_LABELS: Record<string, string> = {
  market: '시장 유형',
  domain: '지식 영역',
  level: '경험 수준',
};

export function Sidebar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: categories, isLoading } = useCategories();
  const { selectedCategories, toggleCategory, clearCategories, isLeftSidebarOpen, toggleLeftSidebar } = useUiStore();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    market: true,
    domain: true,
    level: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const isHome = pathname === '/';

  if (isLoading) {
    return (
      <aside className={cn(
        "shrink-0 hidden md:block transition-all duration-300 ease-in-out overflow-hidden border-r",
        isLeftSidebarOpen ? "w-64 px-4 py-5 opacity-100" : "w-0 p-0 border-r-0 opacity-0 pointer-events-none",
        className
      )}>
        <div className="w-[230px] space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </aside>
    );
  }

  const grouped: Record<string, any[]> = {};
  categories?.forEach((c: any) => {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  });

  const totalSelected = selectedCategories.length;

  return (
    <aside className={cn(
      "shrink-0 hidden md:block border-r transition-all duration-300 ease-in-out overflow-hidden bg-white",
      isLeftSidebarOpen ? "w-64 px-4 py-5 opacity-100" : "w-0 p-0 border-r-0 opacity-0 pointer-events-none",
      className
    )}>
      {/* 내부 콘텐츠의 고정폭을 보장하여 찌그러짐 현상 방지 */}
      <div className="w-[230px] flex flex-col h-full min-h-0">
        
        {/* ── 최상단 헤더 및 접기 버튼 ── */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            카테고리 필터
          </span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleLeftSidebar}
                  className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                />
              }
            >
              <PanelLeft className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
              사이드바 접기
            </TooltipContent>
          </Tooltip>
        </div>

        {/* ── 내 서재 홈 버튼 ── */}
        <button
          onClick={() => {
            clearCategories();
            router.push('/');
          }}
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg transition-all text-left group mb-1',
            isHome
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
          )}
        >
          <div className={cn(
            'w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors',
            isHome ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
          )}>
            <Library className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold block">연구회 서재</span>
            <span className="text-[10px] text-slate-400 leading-none">전체 도서 보기</span>
          </div>
          {isHome && <BookMarked className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </button>

        {/* ── 구분선 ── */}
        <div className="border-t border-slate-100 my-2" />

        {/* ── 필터 헤더 ── */}
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            분류 목록
          </span>
          {totalSelected > 0 && (
            <button
              onClick={() => {
                clearCategories();
                if (pathname !== '/') {
                  router.push('/');
                }
              }}
              className="text-[10px] text-slate-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
            >
              전체 해제 ({totalSelected})
            </button>
          )}
        </div>

        {/* ── 폴더 트리 ── */}
        <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin">
          {['level', 'market', 'domain'].map(group => {
            const list = grouped[group] || [];
            const isExpanded = expandedGroups[group];
            const groupSelected = list.filter((c: any) => selectedCategories.includes(c.id)).length;

            return (
              <div key={group}>
                {/* 그룹 헤더 (폴더) */}
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors text-left group"
                >
                  {/* 펼침/닫힘 화살표 */}
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  }
                  {/* 폴더 아이콘 */}
                  <span className="shrink-0 text-sm leading-none">
                    {isExpanded ? '📂' : '📁'}
                  </span>
                  {/* 그룹 이름 */}
                  <span className="text-sm font-medium text-slate-700 flex-1 truncate">
                    {GROUP_LABELS[group]}
                  </span>
                  {/* 선택된 항목 수 뱃지 */}
                  {groupSelected > 0 && (
                    <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-full shrink-0">
                      {groupSelected}
                    </span>
                  )}
                  {groupSelected === 0 && (
                    <span className="text-[10px] text-slate-300 shrink-0">{list.length}</span>
                  )}
                </button>

                {/* 카테고리 목록 (트리 리프) */}
                {isExpanded && (
                  <div className="ml-3.5 border-l border-slate-100 pl-2.5 mt-0.5 mb-1 space-y-0.5">
                    {list.map((cat: any) => {
                      const isChecked = selectedCategories.includes(cat.id);
                      return (
                        <label
                          key={cat.id}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-all',
                            isChecked
                              ? 'bg-slate-50 hover:bg-slate-100'
                              : 'hover:bg-slate-50'
                          )}
                        >
                          {/* 체크박스 */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              toggleCategory(cat.id);
                              if (pathname !== '/') {
                                router.push('/');
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 cursor-pointer shrink-0 accent-slate-800"
                          />
                          {/* 색상 점 */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: cat.color }}
                          />
                          {/* 카테고리 이름 */}
                          <span className={cn(
                            'text-sm truncate transition-colors leading-tight',
                            isChecked
                              ? 'font-semibold text-slate-800'
                              : 'text-slate-500 group-hover:text-slate-700'
                          )}>
                            {cat.name}
                          </span>
                          {/* 도서 수 */}
                          {cat._count?.books > 0 && (
                            <span className="ml-auto text-[10px] text-slate-300 shrink-0">
                              {cat._count.books}
                            </span>
                          )}
                        </label>
                      );
                    })}

                    {list.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic px-2 py-1">등록된 분류 없음</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── 분류 관리 버튼 ── */}
        <div className="border-t border-slate-100 pt-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs text-slate-400 gap-2 hover:text-slate-700 hover:bg-slate-100"
            onClick={() => router.push('/categories')}
          >
            <Settings className="w-3.5 h-3.5" />
            분류 관리
          </Button>
        </div>
      </div>
    </aside>
  );
}
