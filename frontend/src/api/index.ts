import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ── Users ──────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/users', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data),
};

// ── Customers ──────────────────────────────────────
export const customersApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/customers/${id}`, data),
  addFollowup: (id: string, note: string) =>
    api.post(`/customers/${id}/followups`, { note }),
  getFollowups: (id: string) => api.get(`/customers/${id}/followups`),
};

// ── Products ───────────────────────────────────────
export const productsApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/products/${id}`, data),
  addStock: (id: string, quantity: number, reason: string) =>
    api.post(`/products/${id}/stock`, { quantity, reason }),
  getMovements: (id: string, params?: Record<string, string | number>) =>
    api.get(`/products/${id}/movements`, { params }),
  getCategories: () => api.get('/products/categories'),
};

// ── Challans ───────────────────────────────────────
export const challansApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/challans', { params }),
  getById: (id: string) => api.get(`/challans/${id}`),
  create: (data: Record<string, unknown>) => api.post('/challans', data),
  confirm: (id: string) => api.patch(`/challans/${id}/confirm`),
  cancel: (id: string) => api.patch(`/challans/${id}/cancel`),
};

// ── Dashboard ──────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};
