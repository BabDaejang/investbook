'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUiStore } from '@/store/uiStore';
import { useCategories } from '@/hooks/useCategories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { toast } from 'sonner';
import { X, ExternalLink, Trash2, Save, PanelRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RightSidebar() {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  
  const { 
    isRightSidebarOpen, 
    toggleRightSidebar,
    selectedBookForSidebar, 
    setSelectedBookForSidebar,
    setRightSidebarOpen
  } = useUiStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // 선택된 책이 바뀌거나 사이드바가 열릴 때 상태 초기화
  useEffect(() => {
    if (selectedBookForSidebar) {
      // 카테고리 매핑
      const bookCategories = selectedBookForSidebar.categories?.map((bc: any) => bc.categoryId || bc.category?.id) || [];
      setSelectedIds(bookCategories);
      setNote(selectedBookForSidebar.note || '');
    } else {
      setSelectedIds([]);
      setNote('');
    }
  }, [selectedBookForSidebar]);

  if (!selectedBookForSidebar) {
    return (
      <aside className="shrink-0 hidden md:block transition-all duration-300 ease-in-out overflow-hidden bg-white w-0 border-l-0 h-full" />
    );
  }

  const book = selectedBookForSidebar;
  const authors = typeof book.authors === 'string' ? JSON.parse(book.authors) : book.authors;

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: { categoryIds: string[]; note: string }) => {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update book');
      return res.json();
    },
    onSuccess: (updatedBook) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      // 현재 열려있는 책 상태도 업데이트된 책 정보로 교체
      setSelectedBookForSidebar(updatedBook);
      toast.success('도서 정보가 수정되었습니다.');
    },
    onError: () => {
      toast.error('도서 정보 수정에 실패했습니다.');
    }
  });

  // 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete book');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBookForSidebar(null);
      setRightSidebarOpen(false);
      toast.success('서재에서 도서가 삭제되었습니다.');
    },
    onError: () => {
      toast.error('도서 삭제에 실패했습니다.');
    }
  });

  const toggleCategory = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSave = () => {
    updateMutation.mutate({
      categoryIds: selectedIds,
      note: note.trim()
    });
  };

  const handleDelete = () => {
    if (confirm('이 도서를 서재에서 삭제하시겠습니까?')) {
      deleteMutation.mutate();
    }
  };

  return (
    <aside className={cn(
      "shrink-0 hidden md:block border-l bg-white transition-all duration-300 ease-in-out overflow-hidden shadow-sm h-full",
      isRightSidebarOpen ? "w-80" : "w-12"
    )}>
      {isRightSidebarOpen ? (
        <div className="w-80 h-full flex flex-col">
          {/* 상단 헤더 */}
          <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={toggleRightSidebar}
                      className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 rounded-md"
                    />
                  }
                >
                  <PanelRight className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                  상세 패널 접기
                </TooltipContent>
              </Tooltip>
              <h3 className="font-semibold text-slate-800 text-sm">상세 정보</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedBookForSidebar(null)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 바디 스크롤 영역 */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6">
              {/* 기본 도서 요약 */}
              <div className="flex gap-3">
                <div className="relative w-20 h-28 shrink-0 bg-slate-100 rounded-lg overflow-hidden border shadow-sm">
                  {book.thumbnail ? (
                    <Image src={book.thumbnail} alt={book.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{book.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{authors?.join(', ')}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{book.publisher} · {book.publishedDate}</p>
                  
                  {book.naverUrl && (
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(book.naverUrl, '_blank')} className="h-7 text-[10px] px-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                        네이버 쇼핑 <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* 책 소개 */}
              {book.description && (
                <div className="space-y-2 border-t pt-4">
                  <h5 className="font-semibold text-slate-700 text-xs">책 소개</h5>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                    {book.description}
                  </p>
                </div>
              )}

              {/* 카테고리 편집 */}
              <div className="space-y-2 border-t pt-4">
                <h5 className="font-semibold text-slate-700 text-xs">카테고리 설정</h5>
                <div className="flex flex-wrap gap-1.5">
                  {categories?.map((cat: any) => (
                    <CategoryBadge 
                      key={cat.id} 
                      category={cat} 
                      selected={selectedIds.includes(cat.id)}
                      onClick={() => toggleCategory(cat.id)}
                      className="text-[10px] px-2 py-0.5"
                    />
                  ))}
                  {categories?.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">등록된 카테고리가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* 큐레이터 메모 편집 */}
              <div className="space-y-2 border-t pt-4">
                <h5 className="font-semibold text-slate-700 text-xs">큐레이터 메모</h5>
                <Textarea 
                  placeholder="이 책이 어떤 점에서 유용한지 메모를 남겨보세요." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-28 text-xs resize-none rounded-lg bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </ScrollArea>

          {/* 하단 제어 바 */}
          <div className="p-3 border-t bg-slate-50 flex items-center justify-between gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 rounded-lg">
              <Trash2 className="w-4 h-4 mr-1.5" /> 삭제
            </Button>
            
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-1.5" /> 저장
            </Button>
          </div>
        </div>
      ) : (
        /* 접힌 상태의 축소 콘텐츠 */
        <div className="w-full flex flex-col items-center h-full py-5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleRightSidebar}
                  className="h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md"
                />
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
              상세 패널 펼치기
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
