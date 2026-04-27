export type Role = 'OWNER' | 'STAFF' | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type UnitType = 'BOX' | 'CRATE' | 'PACKET' | 'PIECE' | 'DOZEN' | 'KG' | 'LITRE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  phone?: string;
  businessName?: string;
  address?: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface Agency {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children?: Category[];
}

export interface Inventory {
  totalStock: number;
  reservedStock: number;
  availableStock?: number;
  lowStockThreshold: number;
  isLowStock?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  imageUrls: string[];
  unitType: UnitType;
  unitsPerCase: number;
  pricePerUnit: number;
  taxPercent: number;
  isActive: boolean;
  isFeatured: boolean;
  minOrderQty: number;
  maxOrderQty?: number;
  agency: { id: string; name: string; logoUrl?: string };
  category: { id: string; name: string; slug: string };
  inventory?: Inventory;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: { id: string; sku: string; name: string; unitType: string; imageUrls: string[] };
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  subtotal: number;
  fulfilledQty: number;
}

export interface OrderStatusHistory {
  id: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  note?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: { id: string; name: string; businessName?: string; email?: string; phone?: string };
  status: OrderStatus;
  totalAmount: number;
  taxAmount: number;
  notes?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  paymentMethod?: 'COD' | 'QR';
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  paymentReceiptUrl?: string;
  paymentReceiptNote?: string;
  rejectionReason?: string;
  approvedBy?: { id: string; name: string };
  approvedAt?: string;
  pendingAt: string;
  processingAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id: string;
  companyName: string;
  companyLogoUrl?: string;
  paymentQrUrl?: string;
  upiId?: string;
  bankDetails?: string;
  onlineGatewayNote?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount?: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Formatting helpers
export const formatCurrency = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const formatDate = (date?: string | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  PROCESSING: 'bg-orange-100 text-orange-800',
  DISPATCHED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};
