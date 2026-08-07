import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCategories } from '@/hooks/useCategories';
import { useSaveBook } from '@/hooks/useBooks';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { toast } from 'sonner';

interface BookDetailPanelProps {
  book: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookDetailPanel({ book, isOpen, onClose }: BookDetailPanelProps) {
  const { data: categories } = useCategories();
  const { mutate: saveBook, isPending } = useSaveBook();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // 패널이 열리거나 대상 도서가 변경될 때 선택 값 초기화
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setNote('');
    }
  }, [isOpen, book]);

  if (!book) return null;

  const toggleCategory = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSave = () => {
    saveBook({
      ...book,
      categoryIds: selectedIds,
      note,
    }, {
      onSuccess: () => {
        toast.success('서재에 추가되었습니다.');
        onClose();
        setSelectedIds([]);
        setNote('');
      },
      onError: () => {
        toast.error('도서 추가에 실패했습니다.');
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col gap-0 border-l">
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="relative w-28 h-40 shrink-0 bg-muted rounded-md overflow-hidden border shadow-sm">
                {book.thumbnail && <Image src={book.thumbnail} alt={book.title} fill className="object-cover" sizes="112px" />}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold leading-tight">{book.title}</h2>
                <p className="text-sm text-muted-foreground">{book.authors?.join(', ')}</p>
                <p className="text-sm text-muted-foreground">{book.publisher} · {book.publishedDate}</p>
                {book.isbn13 && <p className="text-xs text-slate-400 mt-1">ISBN: {book.isbn13}</p>}
                
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => window.open(book.naverUrl || `https://search.daum.net/search?w=book&q=${encodeURIComponent(book.isbn13 || book.title)}`, '_blank')} className="h-8 text-xs bg-[#0074E8]/10 text-[#0074E8] border-[#0074E8]/20 hover:bg-[#0074E8]/20">
                    다음 책
                  </Button>
                </div>
              </div>
            </div>

            {book.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">책 소개</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {book.description}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">카테고리 선택</h3>
              <div className="flex flex-wrap gap-2">
                {categories?.map((cat: any) => (
                  <CategoryBadge 
                    key={cat.id} 
                    category={cat} 
                    selected={selectedIds.includes(cat.id)}
                    onClick={() => toggleCategory(cat.id)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">큐레이터 메모</h3>
              <Textarea 
                placeholder="이 책이 어떤 점에서 유용한지 메모를 남겨보세요." 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-24 resize-none"
              />
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? '저장 중...' : '서재에 추가'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
