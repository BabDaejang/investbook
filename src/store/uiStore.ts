import { create } from 'zustand';

interface UiState {
  selectedCategories: string[];
  searchQuery: string;
  sortBy: string;
  
  toggleCategory: (categoryId: string) => void;
  clearCategories: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedCategories: [],
  searchQuery: '',
  sortBy: 'createdAt_desc',

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
}));
