import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import type { Product, Order, Notification, PaginatedResponse, User, Agency, Category } from '../types';
import toast from 'react-hot-toast';

// ─── Auth ────────────────────────────────────────────────
export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api.get<User>('/users/me') });

// ─── Products ────────────────────────────────────────────
export const useProducts = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      api.get<PaginatedResponse<Product>>('/products', {
        params: { ...params },
      }),
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: !!id,
  });

// ─── Orders ──────────────────────────────────────────────
export const useOrders = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['orders', params],
    queryFn: () =>
      api.get<PaginatedResponse<Order>>('/orders', { params }),
    refetchInterval: 30_000,
  });

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post<Order>('/orders', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (err: { message: string }) => toast.error(err.message || 'Failed to place order'),
  });
};

export const useApproveOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order approved!');
    },
    onError: () => toast.error('Failed to approve order'),
  });
};

export const useRejectOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/orders/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order rejected');
    },
    onError: () => toast.error('Failed to reject order'),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/orders/${id}/status`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated!');
    },
    onError: () => toast.error('Failed to update status'),
  });
};

// ─── Notifications ───────────────────────────────────────
export const useNotifications = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['notifications', params],
    queryFn: () =>
      api.get<PaginatedResponse<Notification>>('/notifications', { params }),
    refetchInterval: 60_000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ─── Agencies ────────────────────────────────────────────
export const useAgencies = () =>
  useQuery({
    queryKey: ['agencies'],
    queryFn: () => api.get<PaginatedResponse<Agency>>('/agencies'),
  });

// ─── Categories ──────────────────────────────────────────
export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/categories'),
  });

// ─── Users ───────────────────────────────────────────────
export const useUsers = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get<PaginatedResponse<User>>('/users', { params }),
  });

// ─── Inventory ───────────────────────────────────────────
export const useInventory = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['inventory', params],
    queryFn: () => api.get('/inventory', { params }),
  });

// ─── Reports ─────────────────────────────────────────────
export const useDashboard = () =>
  useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.get('/reports/dashboard'),
    refetchInterval: 60_000,
  });

export const useSalesSummary = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['reports', 'sales', from, to],
    queryFn: () => api.get('/reports/sales-summary', { params: { from, to } }),
  });

export const useTopProducts = (from?: string, to?: string) =>
  useQuery({
    queryKey: ['reports', 'top-products', from, to],
    queryFn: () => api.get<unknown[]>('/reports/top-products', { params: { from, to } }),
  });

export const useLowStock = () =>
  useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: async () => { const r = await api.get<{ count: number; items: unknown[] }>('/reports/low-stock'); return r.items; },
    refetchInterval: 120_000,
  });
