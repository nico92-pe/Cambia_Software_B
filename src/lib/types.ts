export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  birthday?: string;
  cargo: string;
  role: UserRole;
  avatar?: string;
};

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ASESOR_VENTAS = 'ASESOR_VENTAS'
}

export type Client = {
  id: string;
  ruc: string;
  businessName: string;
  commercialName: string;
  address: string;
  district: string;
  province: string;
  salespersonId: string;
  transport?: string;
  transportAddress?: string;
  transportDistrict?: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  code: string;
  name: string;
  wholesalePrice: number;
  retailPrice: number;
  distributorPrice: number;
  creditPrice: number;
  cashPrice: number;
  unitsPerBox: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  stock?: number;
};

export type Order = {
  id: string;
  clientId: string;
  salespersonId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
};

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
}