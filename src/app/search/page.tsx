'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useBookSearch, useBooks } from '@/hooks/useBooks';
import { BookSearchResult } from '@/components/book/BookSearchResult';
import { BookDetailPanel } from '@/components/book/BookDetailPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  const { data: searchResults, isLoading } = useBookSearch(activeQuery);
  const { data: savedBooks } = useBooks({});

  const savedIsbnList = savedBooks?.map((b: any) => b.isbn) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setActiveQuery(query.trim());
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 max-w-4xl py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8 text-center">도서 검색</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-10">
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="제목, 저자, 키워드로 검색해 보세요" 
            className="h-12 text-lg px-4"
          />
          <Button type="submit" className="h-12 px-8">
            <Search className="w-5 h-5 mr-2" /> 검색
          </Button>
        </form>

        <div className="space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="w-full h-[130px] rounded-xl" />)}
            </div>
          )}

          {!isLoading && activeQuery && searchResults?.items?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}

          {!isLoading && searchResults?.items?.map((book: any) => (
            <BookSearchResult 
              key={book.isbn13 || book.title} 
              book={book} 
              isSaved={!!book.isbn13 && savedIsbnList.includes(book.isbn13)}
              onClick={setSelectedBook}
            />
          ))}
        </div>
      </main>

      <BookDetailPanel 
        book={selectedBook} 
        isOpen={!!selectedBook} 
        onClose={() => setSelectedBook(null)} 
      />
    </>
  );
}
