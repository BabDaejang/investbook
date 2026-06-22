'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, Settings, Library, Shield, ShieldAlert, KeyRound, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/store/uiStore';
import { useAdminStatus, useAdminLogin, useAdminLogout } from '@/hooks/useAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

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

  const { data: adminData } = useAdminStatus();
  const logoutMutation = useAdminLogout();
  const loginMutation = useAdminLogin();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clearCategories();
    router.push('/');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput.trim()) return;

    loginMutation.mutate(adminPasswordInput, {
      onSuccess: () => {
        toast.success('관리자 로그인 성공');
        setIsLoginModalOpen(false);
        setAdminPasswordInput('');
      },
      onError: (err: any) => {
        toast.error(err.message || '관리자 로그인 실패');
      }
    });
  };

  const handleAdminLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('관리자 로그아웃 완료');
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center px-4 mx-auto w-full max-w-7xl justify-between gap-4">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <a href="/" onClick={handleLogoClick} className="flex items-center space-x-2 shrink-0">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-2xl tracking-tight hidden lg:inline-block">세종 금융경제교육 교사연구회 도서 탐색기</span>
            <span className="font-bold text-2xl tracking-tight hidden sm:inline-block lg:hidden">도서 탐색기</span>
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

          {adminData?.isAdmin ? (
            <>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                관리자
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAdminLogout}
                disabled={logoutMutation.isPending}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">로그아웃</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsLoginModalOpen(true)}
              className="text-slate-500 hover:text-slate-800 text-xs gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden md:inline">관리자 로그인</span>
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="max-w-xs p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
              관리자 모드 로그인
            </DialogTitle>
            <DialogDescription className="text-xs">
              도서 삭제 권한이 부여되는 관리자 패스워드를 입력해 주세요.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-3.5 pt-1">
            <Input
              type="password"
              placeholder="관리자 비밀번호"
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="h-9 text-xs bg-slate-50 border-slate-200"
              autoFocus
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setAdminPasswordInput('');
                }}
                className="h-8 text-xs w-full sm:w-auto"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="h-8 text-xs w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
              >
                {loginMutation.isPending ? '로그인 중...' : '로그인'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
