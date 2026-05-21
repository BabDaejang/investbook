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

export function useUpdateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { categoryIds?: string[]; note?: string; curator?: string; toc?: string } }) => {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update book');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', data.id] });
    }
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/books/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete book');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    }
  });
}

export function useAddCurationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookId, curator, note }: { bookId: string; curator: string; note: string }) => {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curator, note })
      });
      if (!res.ok) throw new Error('Failed to add curation note');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', data.bookId] });
    }
  });
}

export function useUpdateCurationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, bookId, curator, note }: { noteId: string; bookId: string; curator?: string; note?: string }) => {
      const res = await fetch(`/api/books/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curator, note })
      });
      if (!res.ok) throw new Error('Failed to update curation note');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', data.bookId] });
    }
  });
}

export function useDeleteCurationNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId, bookId }: { noteId: string; bookId: string }) => {
      const res = await fetch(`/api/books/notes/${noteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete curation note');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['books', variables.bookId] });
    }
  });
}


