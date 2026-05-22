'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BookGrid } from '@/components/book/BookGrid';
import { useBooks } from '@/hooks/useBooks';
import { useUiStore } from '@/store/uiStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Home() {
  const { 
    selectedCategories, 
    sortBy, 
    setSortBy,
    isLeftSidebarOpen, 
    isRightSidebarOpen, 
    toggleLeftSidebar, 
    toggleRightSidebar,
    selectedBookForSidebar
  } = useUiStore();

  const { data: books, isLoading } = useBooks({ 
    categoryIds: selectedCategories, 
    sort: sortBy 
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header />
      <div className="flex-1 flex justify-center w-full max-w-7xl mx-auto px-4 py-8 overflow-hidden">
        {/* 전체 높이를 고정하여 스크롤 독립성을 보장 */}
        <div className="flex w-full gap-4 overflow-hidden h-[calc(100vh-8rem)] relative">
          <Sidebar />
          
          {/* 왼쪽 사이드바 토글 버튼 (사이드바 바로 옆 배치) */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger 
                render={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleLeftSidebar}
                    className="text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 h-8 w-8 rounded-full border border-slate-200 bg-white shadow-xs shrink-0 transition-colors z-20" 
                  />
                }
              >
                <PanelLeft className={cn("h-4 w-4 transition-transform duration-200", !isLeftSidebarOpen && "rotate-180")} />
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                {isLeftSidebarOpen ? "왼쪽 사이드바 접기" : "왼쪽 사이드바 펼치기"}
              </TooltipContent>
            </Tooltip>
          </div>
          
          <main className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">연구회 서재</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">정렬:</span>
                <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
                  <SelectTrigger className="w-[125px] h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <SelectValue placeholder="정렬 기준" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="createdAt_desc">최신 추가순</SelectItem>
                    <SelectItem value="publishedDate_desc">최신 출간일순</SelectItem>
                    <SelectItem value="title_asc">제목순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex-1">
              <BookGrid books={books || []} isLoading={isLoading} />
            </div>
          </main>
          
          {/* 오른쪽 사이드바 토글 버튼 (사이드바 바로 옆 배치) */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger 
                render={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleRightSidebar}
                    disabled={!selectedBookForSidebar}
                    className="text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-30 disabled:pointer-events-none h-8 w-8 rounded-full border border-slate-200 bg-white shadow-xs shrink-0 transition-colors z-20" 
                  />
                }
              >
                <PanelRight className={cn("h-4 w-4 transition-transform duration-200", isRightSidebarOpen && "rotate-180")} />
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                {isRightSidebarOpen ? "오른쪽 사이드바 접기" : "오른쪽 사이드바 펼치기"}
              </TooltipContent>
            </Tooltip>
          </div>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
