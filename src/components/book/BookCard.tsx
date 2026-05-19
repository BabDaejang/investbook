import Image from 'next/image';
import Link from 'next/link';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookCardProps {
  book: any;
}

export function BookCard({ book }: BookCardProps) {
  const categories = book.categories?.map((bc: any) => bc.category) || [];
  const displayCategories = categories.slice(0, 3);
  const extraCategories = categories.length - 3;
  
  const authors = typeof book.authors === 'string' ? JSON.parse(book.authors) : book.authors;

  return (
    <Tooltip>
      <TooltipTrigger render={<Link href={`/books/${book.id}`} className="group flex flex-col gap-2 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all p-3 h-full" />}>
          <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-muted">
            {book.thumbnail ? (
              <Image 
                src={book.thumbnail} 
                alt={book.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>
          
          <div className="flex flex-col flex-1 gap-1">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {authors?.join(', ')}
            </p>
            
            <div className="mt-auto pt-2 flex flex-wrap gap-1">
              {displayCategories.map((c: any) => (
                <CategoryBadge key={c.id} category={c} className="text-[10px] px-1.5 py-0 h-4" />
              ))}
              {extraCategories > 0 && (
                <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 rounded-full flex items-center">
                  +{extraCategories}
                </span>
              )}
            </div>
          </div>
      </TooltipTrigger>
      {book.description && (
        <TooltipContent side="right" className="max-w-[280px] p-4 text-sm leading-relaxed z-50">
          {book.description.length > 200 
            ? `${book.description.substring(0, 200)}...` 
            : book.description}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
