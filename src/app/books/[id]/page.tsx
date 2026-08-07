'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import { getHighResThumbnail } from '@/lib/bookImage';
import { ShareButtons } from '@/components/book/ShareButtons';
import { useRouter } from 'next/navigation';
import { useBookDetail, useUpdateBook, useDeleteBook, useAddCurationNote, useUpdateCurationNote, useDeleteCurationNote } from '@/hooks/useBooks';
import { useCategories } from '@/hooks/useCategories';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft, ExternalLink, Trash2, Save, Sparkles, BookOpen,
  Check, Loader2, ShieldAlert
} from 'lucide-react';
import { useAdminStatus } from '@/hooks/useAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GROUP_LABELS: Record<string, string> = {
  market: '시장 유형',
  domain: '지식 영역',
  level: '경험 수준',
};

const formatDate = (dateStr: any) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

function formatTOC(toc: string): string {
  if (!toc) return '';
  
  const lines = toc
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '');
    
  const formattedLines: string[] = [];
  let currentLine = '';
  
  // Chapter-like starts: 제1장, 1부, Chapter 1, PART 1, 머리말, 서문, etc.
  const chapterRegex = /^(제?\d+([장부편회강주차화과]))|^(chapter|part|section|ch|vol|step|ep|prologue|epilogue|intro|outro|머리말|꼬리말|맺음말|들어가는|나가는|여는|닫는|들어가며|마치며|부록|참고문헌|찾아보기|색인|추천사|서문|발문|감사의글|작가의말|일러두기)/i;
  
  for (const line of lines) {
    const isNewChapter = chapterRegex.test(line);
    
    if (isNewChapter) {
      if (currentLine) {
        formattedLines.push(currentLine);
      }
      currentLine = line;
    } else {
      if (!currentLine) {
        currentLine = line;
      } else {
        if (currentLine.length + line.length > 90) {
          formattedLines.push(currentLine);
          currentLine = line;
        } else {
          const separator = currentLine.endsWith(':') || currentLine.endsWith(')') ? ' ' : ' / ';
          currentLine += separator + line;
        }
      }
    }
  }
  
  if (currentLine) {
    formattedLines.push(currentLine);
  }
  
  return formattedLines.join('\n');
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const { data: adminData } = useAdminStatus();
  const isAdmin = !!adminData?.isAdmin;

  const [deletePassword, setDeletePassword] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  const { data: book, isLoading } = useBookDetail(resolvedParams.id);
  const { data: allCategories } = useCategories();
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();
  const addCurationNoteMutation = useAddCurationNote();
  const updateCurationNoteMutation = useUpdateCurationNote();
  const deleteCurationNoteMutation = useDeleteCurationNote();

  // 큐레이션 편집 상태 (카테고리 및 목차만)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [toc, setToc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadedBookId, setLoadedBookId] = useState<string | null>(null);

  // 다중 큐레이션 메모 상태
  const [newCurator, setNewCurator] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editCurator, setEditCurator] = useState('');
  const [editNote, setEditNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // 본문 영역 펼침 상태
  const [descExpanded, setDescExpanded] = useState(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);
  const [tocExpanded, setTocExpanded] = useState(false);

  const toggleNoteExpanded = (noteId: string) => {
    setExpandedNoteIds(prev =>
      prev.includes(noteId) ? prev.filter(id => id !== noteId) : [...prev, noteId]
    );
  };

  // 도서 데이터 로드 시 기존 값으로 최초 1회만 초기화
  useEffect(() => {
    console.log("DEBUG: useEffect triggered. book:", !!book, "loadedBookId:", loadedBookId, "book.id:", book?.id);
    if (book && loadedBookId !== book.id) {
      console.log("DEBUG: Initializing states. book.toc:", book.toc);
      setLoadedBookId(book.id);
      setSelectedCategoryIds(book.categories?.map((bc: any) => bc.categoryId) || []);
      setToc(book.toc || '');
    }
  }, [book, loadedBookId]);

  // 알라딘 목차 수동 스크래핑 실행
  const handleScrapeToc = () => {
    if (!book || !book.isbn) return;
    toast.loading('알라딘에서 목차를 수집하는 중입니다...', { id: 'scrape-toc' });
    updateBookMutation.mutate(
      {
        id: resolvedParams.id,
        data: { scrapeToc: true } as any
      },
      {
        onSuccess: (updatedBook) => {
          if (updatedBook.toc && updatedBook.toc !== '목차 정보가 없습니다.') {
            setToc(updatedBook.toc);
            toast.success('도서 목차가 성공적으로 수집되었습니다.', { id: 'scrape-toc' });
          } else {
            toast.error('목차 정보를 찾을 수 없습니다.', { id: 'scrape-toc' });
          }
        },
        onError: () => {
          toast.error('목차 수집 중 오류가 발생했습니다.', { id: 'scrape-toc' });
        }
      }
    );
  };

  const groupedCategories = {
    market: allCategories?.filter((c: any) => c.group === 'market') || [],
    domain: allCategories?.filter((c: any) => c.group === 'domain') || [],
    level: allCategories?.filter((c: any) => c.group === 'level') || [],
  };

  // 분류 토글
  const handleToggleCategory = (catId: string) => {
    const nextIds = selectedCategoryIds.includes(catId)
      ? selectedCategoryIds.filter(id => id !== catId)
      : [...selectedCategoryIds, catId];

    setSelectedCategoryIds(nextIds);
  };

  // 큐레이션 저장
  const handleSaveNote = () => {
    setIsSaving(true);
    updateBookMutation.mutate(
      { 
        id: resolvedParams.id, 
        data: { 
          categoryIds: selectedCategoryIds
        } 
      },
      {
        onSuccess: () => {
          toast.success('분류 정보가 저장되었습니다.');
          setIsSaving(false);
        },
        onError: () => {
          toast.error('저장에 실패했습니다.');
          setIsSaving(false);
        },
      }
    );
  };

  // 큐레이션 메모 추가
  const handleAddNote = () => {
    if (!newCurator.trim() || !newNote.trim()) {
      toast.error('이름과 메모 내용을 입력해주세요.');
      return;
    }
    setIsAdding(true);
    addCurationNoteMutation.mutate(
      {
        bookId: resolvedParams.id,
        curator: newCurator,
        note: newNote,
      },
      {
        onSuccess: () => {
          toast.success('큐레이션 메모가 추가되었습니다.');
          setNewNote('');
          setIsAdding(false);
        },
        onError: () => {
          toast.error('큐레이션 메모 추가에 실패했습니다.');
          setIsAdding(false);
        }
      }
    );
  };

  // 큐레이션 메모 수정
  const handleUpdateNote = (noteId: string) => {
    if (!editCurator.trim() || !editNote.trim()) {
      toast.error('이름과 메모 내용을 입력해주세요.');
      return;
    }
    setIsEditing(true);
    updateCurationNoteMutation.mutate(
      {
        noteId,
        bookId: resolvedParams.id,
        curator: editCurator,
        note: editNote,
      },
      {
        onSuccess: () => {
          toast.success('큐레이션 메모가 수정되었습니다.');
          setEditingNoteId(null);
          setEditCurator('');
          setEditNote('');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('큐레이션 메모 수정에 실패했습니다.');
          setIsEditing(false);
        }
      }
    );
  };

  // 큐레이션 메모 삭제
  const handleDeleteNote = (noteId: string) => {
    if (!confirm('정말로 이 큐레이션 메모를 삭제하시겠습니까?')) return;
    deleteCurationNoteMutation.mutate(
      {
        noteId,
        bookId: resolvedParams.id,
      },
      {
        onSuccess: () => {
          toast.success('큐레이션 메모가 삭제되었습니다.');
        },
        onError: () => {
          toast.error('큐레이션 메모 삭제에 실패했습니다.');
        }
      }
    );
  };

  // 도서 삭제
  const handleDelete = () => {
    deleteBookMutation.mutate({
      id: resolvedParams.id,
      password: isAdmin ? undefined : deletePassword
    }, {
      onSuccess: () => {
        toast.success('서재에서 삭제되었습니다.');
        router.push('/');
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
          toast.error(err.message || '삭제에 실패했습니다.');
        }
      },
    });
  };

  const renderCurationPanel = (isMobile = false) => {
    return (
      <div className={`flex flex-col min-h-0 ${isMobile ? '' : 'h-full bg-white'}`}>
        {/* 헤더 */}
        <div className={`p-4 border-b bg-slate-50/50 flex items-center gap-2 shrink-0 ${isMobile ? 'rounded-t-2xl' : ''}`}>
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm text-slate-700">큐레이션 편집</span>
        </div>

        {/* 편집 내용 */}
        <div className="p-5 space-y-6 overflow-y-auto min-h-0 flex-1">
          {/* 분류 지정 */}
          <div className="space-y-3">
            <span className="font-semibold text-xs text-slate-500 block">분류 지정</span>
            <div className="space-y-4">
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
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350 hover:bg-slate-50'
                            }`}
                            style={isAssigned ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                          >
                            {isAssigned && <Check className="w-3 h-3" />}
                            {cat.name}
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
                onClick={handleSaveNote}
                disabled={isSaving || updateBookMutation.isPending}
                className="w-full h-11 text-sm font-semibold bg-slate-800 hover:bg-slate-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                변경사항 저장
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full h-11 text-sm font-medium hover:bg-slate-50"
              >
                이전 화면
              </Button>

              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('서재에서 삭제하는 경우 서재에서 정보가 사라집니다. 정말로 삭제하시겠습니까?')) {
                      handleDelete();
                    }
                  }}
                  disabled={deleteBookMutation.isPending}
                  className="w-full h-11 text-sm text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 서재에서 삭제 (관리자)
                </Button>
              ) : (
                <div className="flex gap-2 items-center w-full mt-1">
                  <Input
                    type="password"
                    placeholder="삭제 비밀번호"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="h-11 text-xs bg-slate-50 border-slate-200 flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    disabled={deleteBookMutation.isPending || !deletePassword}
                    className="h-11 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium shrink-0"
                  >
                    {deleteBookMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-8 overflow-y-auto">
          <Skeleton className="w-full h-96 rounded-xl" />
        </main>
      </AppShell>
    );
  }

  if (!book) {
    return (
      <AppShell>
        <main className="flex-1 p-8 overflow-y-auto flex flex-col items-center justify-center gap-4">
          <BookOpen className="w-16 h-16 text-slate-200" />
          <p className="text-xl font-semibold text-slate-500">도서를 찾을 수 없습니다.</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
          </Button>
        </main>
      </AppShell>
    );
  }

  let authors: string[] = [];
  try {
    authors = typeof book.authors === 'string' ? JSON.parse(book.authors) : (Array.isArray(book.authors) ? book.authors : []);
  } catch (e) {
    authors = typeof book.authors === 'string' && book.authors ? [book.authors] : [];
  }

  let parsedAuthors = '';
  try {
    parsedAuthors = JSON.parse(book.authors || '[]').join(', ');
  } catch {
    parsedAuthors = authors.join(', ');
  }

  return (
    <AppShell>
      {/* 중앙: 도서 상세정보 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
            <Button variant="ghost" className="mb-6 -ml-2 text-slate-500 hover:text-slate-800" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로 가기
            </Button>

            <div className="flex flex-col md:flex-row gap-8">
              {/* 표지 이미지 */}
              <div className="w-full md:w-48 shrink-0">
                <div className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border shadow-md">
                  {book.thumbnail
                    ? <Image src={getHighResThumbnail(book.thumbnail)} alt={book.title} fill className="object-cover" sizes="192px" priority />
                    : <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-12 h-12 text-slate-300" /></div>
                  }
                </div>

                {/* 공유 버튼 */}
                <ShareButtons
                  title={book.title}
                  description={[parsedAuthors, book.publisher].filter(Boolean).join(' · ')}
                  thumbnail={getHighResThumbnail(book.thumbnail)}
                />

                {/* 외부 구매 링크 */}
                <div className="mt-4 flex flex-col gap-2">
                  <Button size="sm" variant="outline" className="w-full text-pink-600 border-pink-200 hover:bg-pink-50 text-xs"
                    onClick={() => window.open(`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${book.isbn || book.title}`, '_blank')}>
                    알라딘
                  </Button>
                  <Button size="sm" className="w-full bg-[#0074E8] hover:bg-[#0074E8]/90 text-white border-none text-xs"
                    onClick={() => window.open(book.naverUrl?.includes('daum.net') ? book.naverUrl : `https://search.daum.net/search?w=book&q=${encodeURIComponent(book.isbn || book.title)}`, '_blank')}>
                    다음 책 <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                    onClick={() => window.open(`https://www.yes24.com/Product/Search?query=${book.isbn || book.title}`, '_blank')}>
                    YES24
                  </Button>
                  <Button size="sm" variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50 text-xs"
                    onClick={() => window.open(`https://search.kyobobook.co.kr/search?keyword=${book.isbn || book.title}`, '_blank')}>
                    교보문고
                  </Button>
                </div>
              </div>

              {/* 도서 정보 */}
              <div className="flex-1 min-w-0 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight leading-snug mb-1">{book.title}</h1>
                  <p className="text-base text-slate-500">{authors?.join(', ')}</p>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm border rounded-xl p-4 bg-white">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">출판사</span>
                    <span className="font-medium">{book.publisher}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">출간일</span>
                    <span className="font-medium">{book.publishedDate}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">ISBN</span>
                    <span className="font-medium font-mono text-xs">{book.isbn}</span>
                  </div>
                </div>

                {/* 1. 책 소개 */}
                {book.description && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-slate-500">책 소개</h3>
                    <div className="relative border rounded-xl bg-white shadow-xs overflow-hidden transition-all duration-300">
                      <div 
                        className={`text-sm leading-relaxed text-slate-650 p-5 ${
                          descExpanded ? 'max-h-none' : 'max-h-[200px] overflow-hidden'
                        }`}
                      >
                        {book.description}
                      </div>
                      
                      {/* 펼치기/접기 그라데이션 오버레이 및 버튼 */}
                      {!descExpanded && book.description.length > 250 && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDescExpanded(true)}
                            className="text-xs font-semibold text-primary hover:bg-slate-50"
                          >
                            [펼치기]
                          </Button>
                        </div>
                      )}
                      {descExpanded && book.description.length > 250 && (
                        <div className="flex justify-center pb-3 border-t border-slate-50 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDescExpanded(false)}
                            className="text-xs font-semibold text-slate-400 hover:bg-slate-50"
                          >
                            [접기]
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. 연구회 큐레이션 메모 (책 소개 바로 하단에 표시) */}
                <div className="space-y-4 border-t pt-5 mt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-500">연구회 큐레이션 메모</h3>
                  </div>

                  {/* 큐레이션 메모 리스트 */}
                  {book.curationNotes && book.curationNotes.length > 0 && (
                    <div className="space-y-4">
                      {book.curationNotes.map((cNote: any) => {
                        const isEditingThisNote = editingNoteId === cNote.id;
                        const isExpanded = expandedNoteIds.includes(cNote.id);
                        
                        return (
                          <div key={cNote.id} className="relative border-l-2 border-slate-300 pl-4 py-1.5 transition-all duration-300">
                            {isEditingThisNote ? (
                              // 개별 댓글 수정 폼
                              <div className="space-y-2">
                                <Textarea
                                  placeholder="도서 추천 이유나 핵심 메모를 입력하세요."
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  className="w-full h-20 text-xs resize-none leading-relaxed border-slate-200 bg-white/50 focus:bg-white focus:border-slate-350"
                                />
                                <div className="flex gap-2 items-center justify-end">
                                  <Input
                                    placeholder="이름"
                                    value={editCurator}
                                    onChange={(e) => setEditCurator(e.target.value)}
                                    className="w-32 h-8 text-xs border-slate-200 bg-white/50 focus:bg-white focus:border-slate-350"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingNoteId(null);
                                      setEditCurator('');
                                      setEditNote('');
                                    }}
                                    className="h-8 px-3 text-[11px] font-medium border-slate-200 text-slate-500 hover:text-slate-700"
                                  >
                                    취소
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateNote(cNote.id)}
                                    disabled={isEditing || updateCurationNoteMutation.isPending}
                                    className="h-8 px-3 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white"
                                  >
                                    {isEditing && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                    댓글 저장
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // 뷰 모드
                              <div className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="font-semibold text-slate-800">{cNote.curator || '이름 없음'}</span>
                                    <span className="text-[10px] text-slate-400">
                                      | {isMounted ? formatDate(cNote.createdAt) : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingNoteId(cNote.id);
                                        setEditCurator(cNote.curator || '');
                                        setEditNote(cNote.note || '');
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-primary hover:bg-slate-100 h-5 px-1.5 rounded"
                                    >
                                      수정
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteNote(cNote.id)}
                                      className="text-[10px] text-slate-400 hover:text-red-500 hover:bg-slate-100 h-5 px-1.5 rounded"
                                    >
                                      삭제
                                    </Button>
                                  </div>
                                </div>
                                <div 
                                  className={`text-xs leading-relaxed text-slate-600 whitespace-pre-line ${
                                    isExpanded ? 'max-h-none' : 'max-h-[120px] overflow-hidden'
                                  }`}
                                >
                                  {cNote.note}
                                </div>

                                {!isExpanded && cNote.note.length > 200 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50/80 via-slate-50/40 to-transparent flex items-end justify-center pb-0">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => toggleNoteExpanded(cNote.id)}
                                      className="text-[10px] font-semibold text-primary hover:bg-transparent"
                                    >
                                      [펼치기]
                                    </Button>
                                  </div>
                                )}
                                {isExpanded && cNote.note.length > 200 && (
                                  <div className="flex justify-center pb-0 border-t border-slate-100 pt-1 mt-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => toggleNoteExpanded(cNote.id)}
                                      className="text-[10px] font-semibold text-slate-400 hover:bg-transparent"
                                    >
                                      [접기]
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 신규 댓글 작성 폼 */}
                  {editingNoteId === null && (
                    <div className="border-l-2 border-slate-200 pl-4 py-1.5 space-y-2 mt-4">
                      <Textarea
                        placeholder="도서 추천 이유나 핵심 메모를 입력하세요."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full h-20 text-xs resize-none leading-relaxed border-slate-200 bg-white/50 focus:bg-white focus:border-slate-350"
                      />
                      <div className="flex gap-2 items-center justify-end">
                        <Input
                          placeholder="이름"
                          value={newCurator}
                          onChange={(e) => setNewCurator(e.target.value)}
                          className="w-32 h-8 text-xs border-slate-200 bg-white/50 focus:bg-white focus:border-slate-350"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          disabled={isAdding || addCurationNoteMutation.isPending}
                          className="h-8 px-3 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-white"
                        >
                          {isAdding && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                          댓글 저장
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. 도서 목차 (큐레이션 메모 바로 하단에 표시) */}
                <div className="space-y-2 border-t pt-5 mt-5">
                  <h3 className="font-semibold text-sm text-slate-500 flex items-center justify-between">
                    <span>목차</span>
                    {(book && (!book.toc || book.toc === '목차 정보가 없습니다.')) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleScrapeToc}
                        disabled={updateBookMutation.isPending}
                        className="text-xs font-semibold text-primary border-primary/20 hover:bg-primary/5 px-2 py-1 h-auto"
                      >
                        {updateBookMutation.isPending ? '수집 중...' : '알라딘 목차 수집'}
                      </Button>
                    )}
                  </h3>
                  
                  {book && book.toc && book.toc !== '목차 정보가 없습니다.' ? (
                    <div className="relative border rounded-xl bg-white shadow-xs overflow-hidden transition-all duration-300">
                      <div 
                        className={`text-sm leading-relaxed text-slate-650 p-5 whitespace-pre-line ${
                          tocExpanded ? 'max-h-none' : 'max-h-[180px] overflow-hidden'
                        }`}
                      >
                        {formatTOC(book.toc)}
                      </div>
                      
                      {!tocExpanded && book.toc.length > 250 && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent flex items-end justify-center pb-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTocExpanded(true)}
                            className="text-xs font-semibold text-primary hover:bg-slate-50"
                          >
                            [펼치기]
                          </Button>
                        </div>
                      )}
                      {tocExpanded && book.toc.length > 250 && (
                        <div className="flex justify-center pb-3 border-t border-slate-50 pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTocExpanded(false)}
                            className="text-xs font-semibold text-slate-400 hover:bg-slate-50"
                          >
                            [접기]
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-xl bg-slate-50/50 p-5 text-center text-sm text-slate-400">
                      목차 정보가 없습니다. 상단의 '알라딘 목차 수집' 버튼을 눌러보세요.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 모바일 화면용 하단 큐레이션 패널 */}
          <div className="lg:hidden mt-8 border-t pt-6 bg-white p-5 rounded-2xl border shadow-sm">
            {renderCurationPanel(true)}
          </div>
        </main>

      {/* 우측: 큐레이션 편집 패널 (데스크톱용) */}
      <aside className="w-80 shrink-0 bg-white border-l flex flex-col min-h-0 shadow-sm hidden lg:flex">
        {renderCurationPanel(false)}
      </aside>
      <div className="hidden">
        {/* 헤더 */}
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm text-slate-700">큐레이션 편집</span>
        </div>

        {/* 편집 내용 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 분류 지정 */}
          <div className="space-y-3">
            <span className="font-semibold text-xs text-slate-500 block">분류 지정</span>
            <div className="space-y-4">
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
                                ? 'text-white border-transparent shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                            style={isAssigned ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                          >
                            {isAssigned && <Check className="w-3 h-3" />}
                            {cat.name}
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
                onClick={handleSaveNote}
                disabled={isSaving || updateBookMutation.isPending}
                className="w-full h-11 text-sm font-semibold bg-slate-800 hover:bg-slate-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                변경사항 저장
              </Button>

              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full h-11 text-sm font-medium hover:bg-slate-50"
              >
                이전 화면
              </Button>

              {isAdmin ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('서재에서 삭제하는 경우 서재에서 정보가 사라집니다. 정말로 삭제하시겠습니까?')) {
                      handleDelete();
                    }
                  }}
                  disabled={deleteBookMutation.isPending}
                  className="w-full h-11 text-sm text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> 서재에서 삭제 (관리자)
                </Button>
              ) : (
                <div className="flex gap-2 items-center w-full mt-1">
                  <Input
                    type="password"
                    placeholder="삭제 비밀번호"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="h-11 text-xs bg-slate-50 border-slate-200 flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleDelete}
                    disabled={deleteBookMutation.isPending || !deletePassword}
                    className="h-11 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 font-medium shrink-0"
                  >
                    {deleteBookMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="max-w-xs p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-red-600">
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
    </AppShell>
  );
}
