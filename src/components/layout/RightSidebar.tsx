'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getHighResThumbnail } from '@/lib/bookImage';
import { useUiStore } from '@/store/uiStore';
import { useCategories } from '@/hooks/useCategories';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { toast } from 'sonner';
import { X, ExternalLink, Trash2, Save, PanelRight, ChevronLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAdminStatus } from '@/hooks/useAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // ── 모든 useState / useEffect / useMutation은 조건문(early return) 위에 선언해야 함 ──
  const { data: adminData } = useAdminStatus();
  const isAdmin = !!adminData?.isAdmin;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // 수정 Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData: { categoryIds: string[]; note: string }) => {
      const res = await fetch(`/api/books/${selectedBookForSidebar?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update book');
      return res.json();
    },
    onSuccess: (updatedBook) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBookForSidebar(updatedBook);
      toast.success('도서 정보가 수정되었습니다.');
    },
    onError: () => {
      toast.error('도서 정보 수정에 실패했습니다.');
    }
  });

  // 삭제 Mutation
  const deleteMutation = useMutation({
    mutationFn: async (password?: string) => {
      const headers: Record<string, string> = {};
      if (password) {
        headers['x-book-password'] = password;
      }
      const res = await fetch(`/api/books/${selectedBookForSidebar?.id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete book');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setSelectedBookForSidebar(null);
      setRightSidebarOpen(false);
      setDeletePassword('');
      toast.success('서재에서 도서가 삭제되었습니다.');
    },
    onError: (err: any) => {
      if (
        err.message?.includes('비밀번호') || 
        err.message?.includes('password') || 
        err.message?.includes('Unauthorized') || 
        err.message?.includes('Forbidden')
      ) {
        setDeleteErrorMessage('입력하신 삭제 비밀번호가 일치하지 않습니다.');
        setIsErrorModalOpen(true);
      } else {
        toast.error(err.message || '도서 삭제에 실패했습니다.');
      }
    }
  });

  // 선택된 책이 바뀔 때 상태 초기화
  useEffect(() => {
    if (selectedBookForSidebar) {
      const bookCategories = selectedBookForSidebar.categories?.map((bc: any) => bc.categoryId || bc.category?.id) || [];
      setSelectedIds(bookCategories);
      setNote(selectedBookForSidebar.note || '');
    } else {
      setSelectedIds([]);
      setNote('');
    }
    setDeletePassword('');
  }, [selectedBookForSidebar]);

  // ── early return: 선택된 책 없으면 빈 패널 반환 ──
  if (!selectedBookForSidebar) {
    return (
      <aside className="shrink-0 hidden md:block transition-all duration-300 ease-in-out overflow-hidden bg-white w-0 border-l-0 h-full" />
    );
  }

  // early return 이후: selectedBookForSidebar가 null이 아님 보장
  const book = selectedBookForSidebar;
  let authors: string[] = [];
  try {
    authors = typeof book.authors === 'string'
      ? JSON.parse(book.authors)
      : (Array.isArray(book.authors) ? book.authors : []);
  } catch (e) {
    authors = typeof book.authors === 'string' && book.authors ? [book.authors] : [];
  }

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
    deleteMutation.mutate(isAdmin ? undefined : deletePassword);
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
                    <Image src={getHighResThumbnail(book.thumbnail)} alt={book.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">{book.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{authors?.join(', ')}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{book.publisher} · {book.publishedDate}</p>

                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => window.open(book.naverUrl?.includes('daum.net') ? book.naverUrl : `https://search.daum.net/search?w=book&q=${encodeURIComponent(book.isbn || book.title)}`, '_blank')} className="h-7 text-[10px] px-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                      다음 책 <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
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
            {isAdmin ? (
              <Button variant="ghost" size="sm" onClick={() => {
                if (confirm('이 도서를 서재에서 삭제하시겠습니까?')) {
                  handleDelete();
                }
              }} disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 rounded-lg">
                <Trash2 className="w-4 h-4 mr-1.5" /> 삭제
              </Button>
            ) : (
              <div className="flex gap-1.5 items-center">
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="h-8 text-[11px] bg-slate-50 border-slate-200 w-20 px-2 rounded-md"
                />
                <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteMutation.isPending || !deletePassword} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 text-[11px] px-2 rounded-md shrink-0">
                  {deleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                  삭제
                </Button>
              </div>
            )}

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

      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="max-w-xs p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-red-650">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              삭제 권한 오류
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {deleteErrorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsErrorModalOpen(false)}
              className="h-8 text-xs w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
