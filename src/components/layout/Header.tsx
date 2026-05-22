'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, Settings, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/store/uiStore';

function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState('');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchVal(q);
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm sm:max-w-md mx-auto flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="search"
          placeholder="도서명, 저자, 키워드 실시간 검색..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="w-full pl-9 pr-4 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all rounded-full"
        />
      </div>
      <Button 
        type="submit" 
        className="h-9 px-4 rounded-full text-xs shrink-0 bg-slate-900 hover:bg-slate-800 text-white transition-colors"
      >
        검색
      </Button>
    </form>
  );
}

export function Header() {
  const router = useRouter();
  const { clearCategories } = useUiStore();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clearCategories();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center px-4 mx-auto w-full max-w-7xl justify-between gap-4">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <a href="/" onClick={handleLogoClick} className="flex items-center space-x-2 shrink-0">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-sm tracking-tight hidden lg:inline-block">세종 금융경제교육 교사연구회 도서 탐색기</span>
            <span className="font-bold text-sm tracking-tight hidden sm:inline-block lg:hidden">도서 탐색기</span>
          </a>
        </div>

        {/* Global Search Input wrapped in Suspense */}
        <Suspense fallback={<div className="flex-1 max-w-sm sm:max-w-md mx-auto h-9 bg-slate-100 rounded-full animate-pulse" />}>
          <HeaderSearch />
        </Suspense>

        {/* Navigation */}
        <div className="flex items-center space-x-2 shrink-0">
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1.5" onClick={handleLogoClick}>
            <Library className="h-4 w-4" />
            <span className="hidden md:inline">내 서재</span>
          </Button>
          <Link href="/categories">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1.5">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">분류 관리</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
