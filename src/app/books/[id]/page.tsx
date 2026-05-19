'use client';

import { use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBookDetail } from '@/hooks/useBooks';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, ArrowLeft } from 'lucide-react';

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: book, isLoading } = useBookDetail(resolvedParams.id);
  const router = useRouter();

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 max-w-5xl py-10">
          <Skeleton className="w-full h-96 rounded-xl" />
        </main>
      </>
    );
  }

  if (!book) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 max-w-5xl py-20 text-center">
          <p className="text-xl font-semibold">도서를 찾을 수 없습니다.</p>
          <Button variant="link" onClick={() => router.back()}>돌아가기</Button>
        </main>
      </>
    );
  }

  const authors = typeof book.authors === 'string' ? JSON.parse(book.authors) : book.authors;
  const categories = book.categories?.map((bc: any) => bc.category) || [];

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 max-w-5xl py-10">
        <Button variant="ghost" className="mb-6 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 뒤로 가기
        </Button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column: Cover */}
          <div className="w-full md:w-1/3 shrink-0">
            <div className="relative w-full aspect-[3/4] bg-muted rounded-xl overflow-hidden border shadow-md">
              {book.thumbnail && <Image src={book.thumbnail} alt={book.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" priority />}
            </div>
            
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => window.open(book.naverUrl || `https://search.shopping.naver.com/book/search?query=${book.isbn || book.title}`, '_blank')} className="w-full bg-[#03C75A] hover:bg-[#03C75A]/90 text-white border-none shadow-sm">
                네이버 책에서 보기 <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => window.open(`https://www.yes24.com/Product/Search?query=${book.isbn || book.title}`, '_blank')} className="w-full text-blue-600 border-blue-200 bg-blue-50/50 hover:bg-blue-50">
                YES24 검색
              </Button>
              <Button variant="outline" onClick={() => window.open(`https://search.kyobobook.co.kr/search?keyword=${book.isbn || book.title}`, '_blank')} className="w-full text-green-600 border-green-200 bg-green-50/50 hover:bg-green-50">
                교보문고 검색
              </Button>
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">{book.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{authors?.join(', ')}</p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">출판사</span>
                  <span className="font-medium">{book.publisher}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">출간일</span>
                  <span className="font-medium">{book.publishedDate}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">ISBN</span>
                  <span className="font-medium">{book.isbn}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">카테고리</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.length > 0 ? categories.map((cat: any) => (
                  <CategoryBadge key={cat.id} category={cat} className="text-sm px-3 py-1" />
                )) : (
                  <p className="text-sm text-muted-foreground">지정된 카테고리가 없습니다.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <h3 className="font-semibold text-lg">큐레이터 메모</h3>
              {book.note ? (
                <div className="p-4 bg-slate-50 border rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                  {book.note}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">작성된 메모가 없습니다.</p>
              )}
            </div>

            <div className="space-y-3 border-t pt-6">
              <h3 className="font-semibold text-lg">책 소개</h3>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {book.description || '책 소개가 제공되지 않습니다.'}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
