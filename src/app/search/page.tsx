'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiStore } from '@/store/uiStore';
import { useCategories } from '@/hooks/useCategories';
import { useBookSearch, useBooks, useSaveBook, useUpdateBook, useDeleteBook } from '@/hooks/useBooks';
import { BookSearchResult } from '@/components/book/BookSearchResult';
import { toast } from 'sonner';
import Image from 'next/image';
import { 
  Search, Plus, Trash2, ExternalLink, BookOpen, 
  Settings, Sparkles, Folder, Library, Check, Loader2, X 
} from 'lucide-react';

const GROUP_LABELS = { 
  market: '시장 유형', 
  domain: '지식 영역', 
  level: '경험 수준' 
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  // Sync with q parameter in URL
  useEffect(() => {
    setQuery(qParam);
    setActiveQuery(qParam);
  }, [qParam]);
  
  // Right panel curation states
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [toc, setToc] = useState('');
  const [attemptedScrapeIsbns, setAttemptedScrapeIsbns] = useState<string[]>([]);

  const { selectedCategories, clearCategories } = useUiStore();

  // Queries & Mutations
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: searchResults, isLoading: isSearchLoading } = useBookSearch(activeQuery);
  
  // Fetch ALL saved books to find ISBNs for checkmarks
  const { data: allSavedBooks } = useBooks({});
  // Fetch FILTERED saved books to display in center panel by default
  const { data: filteredSavedBooks, isLoading: isFilteredBooksLoading } = useBooks({
    categoryIds: selectedCategories
  });
  
  const saveBookMutation = useSaveBook();
  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();

  // Helper lists
  const savedIsbnList = allSavedBooks?.map((b: any) => b.isbn) || [];
  const savedBook = allSavedBooks?.find((b: any) => b.isbn === selectedBook?.isbn13);
  const isSaved = !!savedBook;

  // 선택한 도서 및 저장 목록 변경 시 우측 패널의 분류, 목차 상태 동기화
  useEffect(() => {
    if (!selectedBook) {
      setSelectedCategoryIds([]);
      setToc('');
      return;
    }
    const currentSaved = allSavedBooks?.find((b: any) => b.isbn === selectedBook.isbn13);
    if (currentSaved) {
      setSelectedCategoryIds(currentSaved.categories.map((bc: any) => bc.categoryId));
      setToc(currentSaved.toc || '');
    } else {
      setSelectedCategoryIds([]);
      setToc('');
    }
  }, [selectedBook, allSavedBooks]);

  // 이미 저장된 도서인데 목차가 없는 경우 자동으로 백그라운드에서 목차 수집
  useEffect(() => {
    if (isSaved && savedBook && !savedBook.toc && savedBook.isbn && !attemptedScrapeIsbns.includes(savedBook.isbn) && !updateBookMutation.isPending) {
      setAttemptedScrapeIsbns(prev => [...prev, savedBook.isbn]);
      console.log("Automatically scraping TOC in search page for book:", savedBook.id);
      updateBookMutation.mutate(
        {
          id: savedBook.id,
          data: { scrapeToc: true } as any
        },
        {
          onSuccess: (updatedBook) => {
            if (updatedBook.toc) {
              setToc(updatedBook.toc);
              toast.success('도서 목차가 자동으로 수집되었습니다.');
            }
          }
        }
      );
    }
  }, [isSaved, savedBook, attemptedScrapeIsbns, updateBookMutation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClearSearch = () => {
    router.push('/search');
  };

  // 우측 패널 분류 지정에 사용
  const groupedCategories = {
    market: categories?.filter((c: any) => c.group === 'market') || [],
    domain: categories?.filter((c: any) => c.group === 'domain') || [],
    level: categories?.filter((c: any) => c.group === 'level') || [],
  };

  // 분류 지정 상태 변경 (로컬 상태만 변경하며, 즉시 DB에 저장하지 않음)
  const handleToggleCategory = (catId: string) => {
    if (!selectedBook) return;

    const nextIds = selectedCategoryIds.includes(catId)
      ? selectedCategoryIds.filter(id => id !== catId)
      : [...selectedCategoryIds, catId];

    setSelectedCategoryIds(nextIds);
  };

  // 큐레이션 저장 / 수정
  const handleCurationSave = () => {
    if (!selectedBook) return;

    if (isSaved && savedBook) {
      // 기존 큐레이션 내용 수정
      updateBookMutation.mutate({
        id: savedBook.id,
        data: {
          categoryIds: selectedCategoryIds,
          toc
        }
      }, {
        onSuccess: () => {
          toast.success('큐레이션 정보가 수정되었습니다.');
        },
        onError: () => {
          toast.error('큐레이션 수정에 실패했습니다.');
        }
      });
    } else {
      // 신규 도서 서재 등록 및 큐레이션 생성
      saveBookMutation.mutate({
        ...selectedBook,
        categoryIds: selectedCategoryIds,
        toc
      }, {
        onSuccess: (newBook) => {
          toast.success('서재에 도서가 등록되었습니다.');
          // Update selected book reference to the saved version
          setSelectedBook({
            ...selectedBook,
            id: newBook.id
          });
        },
        onError: () => {
          toast.error('도서 등록에 실패했습니다.');
        }
      });
    }
  };

  // Delete from Library
  const handleCurationDelete = () => {
    if (!isSaved || !savedBook) return;
    if (confirm('서재에서 삭제하는 경우 서재에서 정보가 사라집니다. 정말로 삭제하시겠습니까?')) {
      deleteBookMutation.mutate(savedBook.id, {
        onSuccess: () => {
          toast.success('서재에서 삭제되었습니다.');
          setSelectedBook(null);
        },
        onError: () => {
          toast.error('도서 삭제에 실패했습니다.');
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-50">
      <Header />
      
      {/* 3-Column Workspace Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Column 1: 분류하기 Panel (Left) */}
        <Sidebar className="w-64 shrink-0 bg-white border-r px-4 py-5 z-10 shadow-sm min-h-0" />

        {/* Column 2: 검색 결과 Panel (Center) */}
        <main className="flex-1 flex flex-col bg-slate-50/50 min-w-0 min-h-0">
          {/* Always Visible Search Bar */}
          <div className="p-4 border-b bg-white flex flex-col gap-2">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <Input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="도서 제목, 저자, 출판사명으로 네이버 검색" 
                className="h-10 text-sm bg-slate-50 border-slate-200"
              />
              <Button type="submit" className="h-10 px-5 shrink-0">
                <Search className="w-4 h-4 mr-2" /> 검색
              </Button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="p-6 max-w-3xl mx-auto space-y-4">
              
              {/* Header explaining what list is currently shown */}
              {activeQuery ? (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    네이버 검색 결과: &ldquo;<span className="text-primary">{activeQuery}</span>&rdquo;
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearSearch}
                    className="h-7 text-xs text-muted-foreground hover:bg-slate-100"
                  >
                    <X className="w-3 h-3 mr-1" /> 검색 결과 닫기 (내 서재 보기)
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Library className="w-4 h-4 text-slate-500" />
                    {selectedCategories.length > 0 ? '필터링된 내 서재 도서' : '내 서재 전체 도서'}
                    <span className="text-xs text-slate-400 font-normal">({filteredSavedBooks?.length || 0}권)</span>
                  </span>
                  {selectedCategories.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => clearCategories()}
                      className="h-7 text-xs text-primary hover:bg-slate-100"
                    >
                      필터 초기화
                    </Button>
                  )}
                </div>
              )}

              {/* Rendering list */}
              {activeQuery ? (
                // 1. Naver Search results view
                isSearchLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-24 rounded-xl" />)}
                  </div>
                ) : searchResults?.items?.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2 bg-white rounded-xl border p-8">
                    <Library className="w-12 h-12 text-slate-300" />
                    <span>네이버 검색 결과가 없습니다. 다른 검색어를 입력해 보세요.</span>
                  </div>
                ) : (
                  searchResults?.items?.map((book: any) => {
                    const bookIsSaved = savedIsbnList.includes(book.isbn13);
                    const isSelected = selectedBook && (selectedBook.isbn13 === book.isbn13);

                    return (
                      <div 
                        key={book.isbn13 || book.title}
                        onClick={() => setSelectedBook(book)}
                        className={`cursor-pointer transition-all border rounded-xl overflow-hidden ${
                          isSelected 
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <BookSearchResult 
                          book={book} 
                          isSaved={bookIsSaved}
                          savedBook={allSavedBooks?.find((b: any) => b.isbn === book.isbn13)}
                          onClick={() => {}}
                        />
                      </div>
                    );
                  })
                )
              ) : (
                // 2. Saved library books view (filtered or unfiltered)
                isFilteredBooksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-24 rounded-xl" />)}
                  </div>
                ) : filteredSavedBooks?.length === 0 ? (
                  <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3 bg-white rounded-xl border p-12">
                    <BookOpen className="w-12 h-12 text-slate-200" />
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-500">
                        {selectedCategories.length > 0 ? '해당 분류에 속한 도서가 없습니다.' : '내 서재가 비어 있습니다.'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedCategories.length > 0 
                          ? '다른 필터를 선택해 보거나 분류 지정을 변경해 보세요.' 
                          : '상단 검색창에서 도서를 검색해 내 서재에 추가해 보세요.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredSavedBooks?.map((book: any) => {
                    // Match with book interface
                    let parsedAuthors: string[] = [];
                    try {
                      parsedAuthors = typeof book.authors === 'string' ? JSON.parse(book.authors) : (Array.isArray(book.authors) ? book.authors : []);
                    } catch (e) {
                      parsedAuthors = typeof book.authors === 'string' && book.authors ? [book.authors] : [];
                    }
                    const normalizedBook = {
                      isbn13: book.isbn,
                      title: book.title,
                      authors: parsedAuthors,
                      publisher: book.publisher,
                      publishedDate: book.publishedDate,
                      thumbnail: book.thumbnail,
                      description: book.description,
                      naverUrl: book.naverUrl
                    };
                    const isSelected = selectedBook && (selectedBook.isbn13 === book.isbn);

                    return (
                      <div 
                        key={book.id}
                        onClick={() => setSelectedBook(normalizedBook)}
                        className={`cursor-pointer transition-all border rounded-xl overflow-hidden ${
                          isSelected 
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <BookSearchResult 
                          book={normalizedBook} 
                          isSaved={true}
                          onClick={() => {}}
                        />
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        </main>

        {/* Column 3: 큐레이션 및 상세 Panel (Right) */}
        <aside className="w-96 shrink-0 bg-white border-l flex flex-col min-h-0 z-10 shadow-sm">
          {!selectedBook ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-slate-50/20">
              <Library className="w-10 h-10 text-slate-300 mb-3" />
              <p className="font-semibold text-sm text-slate-400">도서 정보 패널</p>
              <p className="text-xs text-slate-400 max-w-[220px] mt-1">도서 검색 또는 서재 목록에서 도서를 선택하시면 상세 내역 확인 및 큐레이션 메모 작성이 가능합니다.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                <div className="space-y-6 pb-6">
                  {/* Book Basic Info */}
                  <div className="flex gap-4">
                    <div className="relative w-20 h-28 shrink-0 bg-muted rounded border overflow-hidden shadow-xs">
                      {selectedBook.thumbnail ? (
                        <Image 
                          src={selectedBook.thumbnail} 
                          alt={selectedBook.title} 
                          fill 
                          className="object-cover" 
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isSaved ? (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                            <Check className="w-2.5 h-2.5" /> 서재 보관 중
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                            미등록 도서
                          </span>
                        )}
                      </div>
                      {isSaved && savedBook ? (
                        <Link 
                          href={`/books/${savedBook.id}`} 
                          className="font-bold text-base text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer"
                        >
                          {selectedBook.title}
                        </Link>
                      ) : (
                        <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                          {selectedBook.title}
                        </h3>
                      )}
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {selectedBook.authors?.join(', ')}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {selectedBook.publisher} · {selectedBook.publishedDate}
                      </p>
                    </div>
                  </div>

                  {/* External Store Search */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${selectedBook.isbn13 || selectedBook.title}`, '_blank')}
                      className="h-8 text-[11px] text-pink-600 border-pink-100 hover:bg-pink-50/50 px-1"
                    >
                      알라딘
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(selectedBook.naverUrl || `https://search.shopping.naver.com/book/search?query=${selectedBook.isbn13 || selectedBook.title}`, '_blank')}
                      className="h-8 text-[11px] bg-[#03C75A]/5 text-[#03C75A] border-[#03C75A]/20 hover:bg-[#03C75A]/10 hover:text-[#03C75A] px-1"
                    >
                      네이버
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://www.yes24.com/Product/Search?query=${selectedBook.isbn13 || selectedBook.title}`, '_blank')}
                      className="h-8 text-[11px] text-blue-600 border-blue-100 hover:bg-blue-50/50 px-1"
                    >
                      YES24
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(`https://search.kyobobook.co.kr/search?keyword=${selectedBook.isbn13 || selectedBook.title}`, '_blank')}
                      className="h-8 text-[11px] text-green-600 border-green-100 hover:bg-green-50/50 px-1"
                    >
                      교보문고
                    </Button>
                  </div>

                  {/* Category Assignment badges (Clickable to assign) */}
                  <div className="space-y-3 border-t pt-5">
                    <span className="font-semibold text-xs text-slate-500 block">분류 지정</span>
                    <div className="space-y-4 pr-1">
                      {Object.entries(GROUP_LABELS).map(([groupKey, groupLabel]) => {
                        const list = groupedCategories[groupKey as keyof typeof groupedCategories];
                        if (!list || list.length === 0) return null;
                        return (
                          <div key={groupKey} className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{groupLabel}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {list.map((cat: any) => {
                                const isAssigned = selectedCategoryIds.includes(cat.id);
                                return (
                                  <button
                                    key={cat.id}
                                    onClick={() => handleToggleCategory(cat.id)}
                                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 font-medium ${
                                      isAssigned
                                        ? 'border-primary bg-primary/5 text-primary shadow-xs'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span 
                                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                                      style={{ backgroundColor: cat.color }} 
                                    />
                                    {cat.name}
                                    {isAssigned && <Check className="w-2.5 h-2.5 ml-0.5 text-primary" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 큐레이션 동작 버튼 */}
                  <div className="space-y-4 border-t pt-5">
                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        onClick={handleCurationSave}
                        disabled={saveBookMutation.isPending || updateBookMutation.isPending}
                        className="w-full h-11 text-sm font-semibold"
                      >
                        {(saveBookMutation.isPending || updateBookMutation.isPending) && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        변경사항 저장
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setSelectedBook(null)}
                        className="w-full h-11 text-sm font-medium hover:bg-slate-50"
                      >
                        이전 화면
                      </Button>

                      {isSaved && (
                        <Button 
                          variant="outline" 
                          onClick={handleCurationDelete}
                          disabled={deleteBookMutation.isPending}
                          className="w-full h-11 text-sm text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> 서재에서 삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">검색 페이지 로딩 중...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>

  );
}
