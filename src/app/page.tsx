'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { BookGrid } from '@/components/book/BookGrid';
import { useBooks } from '@/hooks/useBooks';
import { useUiStore } from '@/store/uiStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const { selectedCategories, sortBy, setSortBy } = useUiStore();
  const { data: books, isLoading } = useBooks({ 
    categoryIds: selectedCategories, 
    sort: sortBy 
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Header />
      <div className="flex-1 flex justify-center w-full max-w-7xl mx-auto px-4 py-8 overflow-hidden">
        {/* 전체 높이를 고정하여 스크롤 독립성을 보장 */}
        <div className="flex w-full gap-6 overflow-hidden h-[calc(100vh-8rem)]">
          <Sidebar />
          
          <main className="flex-1 flex flex-col min-w-0 bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-800">내 서재</h1>
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
          
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
