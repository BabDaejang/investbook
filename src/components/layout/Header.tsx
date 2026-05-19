import Link from 'next/link';
import { BookOpen, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center px-4 mx-auto w-full max-w-7xl justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">InvestBook</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Search className="h-4 w-4 mr-2" />
              도서 검색
            </Button>
          </Link>
          <Link href="/categories">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="h-4 w-4 mr-2" />
              카테고리 관리
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
