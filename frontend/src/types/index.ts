// Shared TypeScript types for the ERP+CRM frontend

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id?: string;
  userId: string;
  email: string;
  role: Role;
  name?: string;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: CustomerType;
  address?: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFollowup {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  user: { name: string; role: Role };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minStockQty: number;
  warehouseLocation?: string;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
  user: { name: string; role: Role };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productSnapshot: {
    name: string;
    sku: string;
    category: string;
    warehouseLocation?: string;
  };
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  product?: { name: string; sku: string; currentStock: number };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerSnapshot: {
    name: string;
    mobile: string;
    email?: string;
    businessName?: string;
    gstNumber?: string;
  };
  status: ChallanStatus;
  totalQty: number;
  totalAmount: number | string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  customer?: { name: string; mobile: string; businessName?: string };
  creator?: { name: string };
  items?: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: {
    [key: string]: T[] | Pagination;
    pagination: Pagination;
  };
}

export interface DashboardStats {
  customers: { total: number; active: number };
  products: { total: number; lowStock: number };
  challans: { total: number; confirmed: number; draft: number };
  recentChallans: Challan[];
  lowStockItems: Product[];
}
