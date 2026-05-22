import { create } from 'zustand';

interface UiState {
  selectedCategories: string[];
  searchQuery: string;
  sortBy: string;
  
  // 사이드바 토글 상태
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  selectedBookForSidebar: any | null;
  
  toggleCategory: (categoryId: string) => void;
  clearCategories: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  
  // 사이드바 액션
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setSelectedBookForSidebar: (book: any | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedCategories: [],
  searchQuery: '',
  sortBy: 'createdAt_desc',
  
  // 초기값 설정
  isLeftSidebarOpen: true,
  isRightSidebarOpen: false,
  selectedBookForSidebar: null,

  toggleCategory: (categoryId) => set((state) => {
    const isSelected = state.selectedCategories.includes(categoryId);
    return {
      selectedCategories: isSelected
        ? state.selectedCategories.filter(id => id !== categoryId)
        : [...state.selectedCategories, categoryId]
    };
  }),
  
  clearCategories: () => set({ selectedCategories: [] }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortBy: (sortBy) => set({ sortBy }),
  
  // 사이드바 액션 구현
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),
  setLeftSidebarOpen: (isLeftSidebarOpen) => set({ isLeftSidebarOpen }),
  setRightSidebarOpen: (isRightSidebarOpen) => set({ isRightSidebarOpen }),
  setSelectedBookForSidebar: (book) => set({ 
    selectedBookForSidebar: book,
    // 책이 선택되면 우측 사이드바를 자동으로 열어줍니다.
    isRightSidebarOpen: book !== null ? true : false
  }),
}));
