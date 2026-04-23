// Role enum
export enum Role {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

// Order status enum
export enum OrderStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Unit type enum
export enum UnitType {
  BOX = 'BOX',
  CRATE = 'CRATE',
  PACKET = 'PACKET',
  PIECE = 'PIECE',
  DOZEN = 'DOZEN',
  KG = 'KG',
  LITRE = 'LITRE',
}

// Status transitions allowed per role
export const STAFF_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.APPROVED]: OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]: OrderStatus.DISPATCHED,
  [OrderStatus.DISPATCHED]: OrderStatus.DELIVERED,
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_APPROVAL]: 'Pending Approval',
  [OrderStatus.APPROVED]: 'Approved',
  [OrderStatus.REJECTED]: 'Rejected',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.DISPATCHED]: 'Dispatched',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_APPROVAL]: 'yellow',
  [OrderStatus.APPROVED]: 'blue',
  [OrderStatus.REJECTED]: 'red',
  [OrderStatus.PROCESSING]: 'orange',
  [OrderStatus.DISPATCHED]: 'purple',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.CANCELLED]: 'gray',
};
