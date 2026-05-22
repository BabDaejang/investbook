'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BookGrid } from '@/components/book/BookGrid';
import { useBooks } from '@/hooks/useBooks';
import { useUiStore } from '@/store/uiStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
          
          {/* 왼쪽 사이드바가 닫혀있을 때 화면 왼쪽 가장자리에 노출되는 펼치기 버튼 */}
          {!isLeftSidebarOpen && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleLeftSidebar}
                      className="h-12 w-4 bg-white border border-l-0 border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-400 rounded-r-lg shadow-sm flex items-center justify-center transition-colors"
                    />
                  }
                >
                  <ChevronRight className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                  카테고리 펼치기
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <Sidebar />
          
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
          
          {/* 오른쪽 사이드바가 닫혀있고 선택된 도서가 있을 때만 노출되는 가장자리 펼치기 버튼 */}
          {!isRightSidebarOpen && selectedBookForSidebar && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleRightSidebar}
                      className="h-12 w-4 bg-white border border-r-0 border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-400 rounded-l-lg shadow-sm flex items-center justify-center transition-colors"
                    />
                  }
                >
                  <ChevronLeft className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                  상세 패널 펼치기
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
