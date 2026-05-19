'use client';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
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
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 max-w-7xl flex py-8 gap-8">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">내 서재</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">정렬:</span>
              <Select value={sortBy} onValueChange={(val) => val && setSortBy(val)}>
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt_desc">최신 추가순</SelectItem>
                  <SelectItem value="publishedDate_desc">최신 출간일순</SelectItem>
                  <SelectItem value="title_asc">제목순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <BookGrid books={books || []} isLoading={isLoading} />
        </div>
      </main>
    </>
  );
}
