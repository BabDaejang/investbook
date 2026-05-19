import { BookCard } from './BookCard';
import { Skeleton } from '@/components/ui/skeleton';

interface BookGridProps {
  books: any[];
  isLoading: boolean;
}

export function BookGrid({ books, isLoading }: BookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-3 border rounded-xl">
            <Skeleton className="w-full aspect-[3/4] rounded-md" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-1 mt-auto pt-2">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <p className="text-lg font-semibold">조건에 맞는 도서가 없습니다.</p>
        <p className="text-sm mt-1">다른 카테고리나 검색어를 시도해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
