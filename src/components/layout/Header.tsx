'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Search, Settings, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/store/uiStore';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  
  const { 
    isLeftSidebarOpen, 
    isRightSidebarOpen, 
    toggleLeftSidebar, 
    toggleRightSidebar,
    selectedBookForSidebar
  } = useUiStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center px-4 mx-auto w-full max-w-7xl justify-between">
        <div className="flex items-center space-x-3">
          {isHome && (
            <Tooltip>
              <TooltipTrigger 
                render={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleLeftSidebar}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 hidden md:flex h-9 w-9 rounded-lg transition-colors" 
                  />
                }
              >
                <PanelLeft className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                왼쪽 사이드바 토글
              </TooltipContent>
            </Tooltip>
          )}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl tracking-tight text-slate-900">InvestBook</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href="/search">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 px-3 rounded-lg">
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">도서 검색</span>
            </Button>
          </Link>
          <Link href="/categories">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 h-9 px-3 rounded-lg mr-1">
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">카테고리 관리</span>
            </Button>
          </Link>
          
          {isHome && (
            <Tooltip>
              <TooltipTrigger 
                render={
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleRightSidebar}
                    disabled={!selectedBookForSidebar}
                    className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none hidden md:flex h-9 w-9 rounded-lg transition-colors" 
                  />
                }
              >
                <PanelRight className="h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white rounded px-2 py-1 shadow-md">
                오른쪽 상세 패널 토글
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
}
