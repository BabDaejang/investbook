import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookSearchResultProps {
  book: any;
  isSaved?: boolean;
  onClick: (book: any) => void;
}

export function BookSearchResult({ book, isSaved, onClick }: BookSearchResultProps) {
  return (
    <Tooltip>
      <TooltipTrigger 
        render={
          <div 
            onClick={() => onClick(book)} 
            className="flex items-start gap-4 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors relative group bg-white border-slate-200/80 shadow-sm" 
          />
        }
      >
        <div className="relative w-16 h-24 shrink-0 bg-slate-100 rounded-md overflow-hidden">
          {book.thumbnail ? (
            <Image src={book.thumbnail} alt={book.title} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Img</div>
          )}
        </div>
        
        <div className="flex flex-col flex-1 gap-1 py-1">
          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-blue-600 transition-colors text-slate-800">
            {book.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">
            {book.authors?.join(', ')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {book.publisher} · {book.publishedDate}
          </p>
        </div>
        
        {isSaved && (
          <div className="absolute top-4 right-4 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium border border-blue-100">
            저장됨
          </div>
        )}
      </TooltipTrigger>
      {book.description && (
        <TooltipContent className="max-w-[300px] p-4 text-xs leading-relaxed z-50 bg-slate-900 text-white rounded shadow-lg">
          {book.description.length > 200 ? `${book.description.substring(0, 200)}...` : book.description}
        </TooltipContent>
      )}
    </Tooltip>
  );
}
