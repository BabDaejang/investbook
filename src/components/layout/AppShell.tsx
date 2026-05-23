'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        {children}
      </div>
    </div>
  );
}
