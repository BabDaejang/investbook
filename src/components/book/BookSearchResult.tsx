import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BookSearchResultProps {
  book: any;
  isSaved?: boolean;
  savedBook?: any; // 저장된 도서 정보 (카테고리 포함)
  onClick: (book: any) => void;
}

export function BookSearchResult({ book, isSaved, savedBook, onClick }: BookSearchResultProps) {
  // 저장된 도서에 지정된 카테고리 목록
  const assignedCategories: any[] = savedBook?.categories?.map((bc: any) => bc.category).filter(Boolean) || [];

  return (
    <Tooltip>
      <TooltipTrigger 
        render={
          <div 
            onClick={() => onClick(book)} 
            className="flex items-start gap-4 p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors relative group bg-white border-slate-200/80 shadow-sm w-full" 
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
        
        <div className="flex flex-col flex-1 gap-1 py-1 min-w-0 pr-16 text-left">
          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-blue-600 transition-colors text-slate-800">
            {book.title}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">
            {book.authors?.join(', ')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {book.publisher} · {book.publishedDate}
          </p>

          {/* 지정된 분류 배지 (저장된 도서만 표시) */}
          {isSaved && assignedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {assignedCategories.map((cat: any) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                  style={{
                    backgroundColor: `${cat.color}18`,
                    borderColor: `${cat.color}50`,
                    color: cat.color,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {/* 저장됨이지만 분류 미지정 */}
          {isSaved && assignedCategories.length === 0 && (
            <div className="mt-1.5">
              <span className="text-[10px] text-slate-400 italic">분류 미지정</span>
            </div>
          )}
        </div>
        
        {/* 저장됨 뱃지 */}
        {isSaved && (
          <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-semibold border border-emerald-200">
            ✓ 등재됨
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
