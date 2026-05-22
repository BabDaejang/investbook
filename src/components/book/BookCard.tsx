'use client';

import Image from 'next/image';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { useUiStore } from '@/store/uiStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookCardProps {
  book: any;
}

export function BookCard({ book }: BookCardProps) {
  const { setSelectedBookForSidebar, selectedBookForSidebar } = useUiStore();
  const categories = book.categories?.map((bc: any) => bc.category) || [];
  const displayCategories = categories.slice(0, 3);
  const extraCategories = categories.length - 3;
  
  const authors = typeof book.authors === 'string' ? JSON.parse(book.authors) : book.authors;
  const isSelected = selectedBookForSidebar?.id === book.id;

  return (
    <Tooltip>
      <TooltipTrigger 
        render={
          <div 
            onClick={() => setSelectedBookForSidebar(book)} 
            className={`group flex flex-col gap-2 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all p-3 h-full cursor-pointer ${
              isSelected ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/10' : 'hover:border-slate-300'
            }`} 
          />
        }
      >
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-md bg-slate-100">
          {book.thumbnail ? (
            <Image 
              src={book.thumbnail} 
              alt={book.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-slate-400 text-xs">
              No Image
            </div>
          )}
        </div>
        
        <div className="flex flex-col flex-1 gap-1">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors text-slate-800">
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {authors?.join(', ')}
          </p>
          
          <div className="mt-auto pt-2 flex flex-wrap gap-1">
            {displayCategories.map((c: any) => (
              <CategoryBadge key={c.id} category={c} className="text-[9px] px-1.5 py-0.5" />
            ))}
            {extraCategories > 0 && (
              <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 rounded-full flex items-center">
                +{extraCategories}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      {book.description && (
        <TooltipContent side="right" className="max-w-[280px] p-4 text-xs leading-relaxed z-50 bg-slate-900 text-white rounded shadow-lg">
          {book.description.length > 150 
            ? `${book.description.substring(0, 150)}...` 
            : book.description}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
