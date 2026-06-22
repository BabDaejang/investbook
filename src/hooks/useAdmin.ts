import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useAdminStatus() {
  return useQuery({
    queryKey: ['adminStatus'],
    queryFn: async () => {
      const res = await fetch('/api/admin/status');
      if (!res.ok) throw new Error('Failed to fetch admin status');
      return res.json() as Promise<{ isAdmin: boolean }>;
    }
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to login');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStatus'] });
    }
  });
}

export function useAdminLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/logout', {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to logout');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStatus'] });
    }
  });
}
