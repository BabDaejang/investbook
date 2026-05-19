import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBooks(params: { categoryIds?: string[]; sort?: string; q?: string }) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.categoryIds?.length) searchParams.set('categoryIds', params.categoryIds.join(','));
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.q) searchParams.set('q', params.q);

      const res = await fetch(`/api/books?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch books');
      return res.json();
    }
  });
}

export function useBookSearch(query: string) {
  return useQuery({
    queryKey: ['books', 'search', query],
    queryFn: async () => {
      if (!query) return { items: [] };
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search books from Naver');
      return res.json();
    },
    enabled: !!query,
  });
}

export function useBookDetail(id: string) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      const res = await fetch(`/api/books/${id}`);
      if (!res.ok) throw new Error('Failed to fetch book detail');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useSaveBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookData: any) => {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData)
      });
      if (!res.ok) throw new Error('Failed to save book');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });
}
