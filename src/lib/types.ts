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
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ASESOR_VENTAS = 'asesor_ventas'
}

export type Client = {
  id: string;
  ruc: string;
  businessName: string;
  commercialName: string;
  contactName: string;
  contactPhone: string;
  address: string;
  district: string;
  province: string;
  salespersonId: string;
  salesperson?: User;
  salespersonName?: string;
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
  stock?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export enum OrderStatus {
  BORRADOR = 'borrador',
  TOMADO = 'tomado',
  CONFIRMADO = 'confirmado',
  EN_PREPARACION = 'en_preparacion',
  DESPACHADO = 'despachado',
}

export type Order = {
  id: string;
  clientId: string;
  salespersonId: string;
  status: OrderStatus;
  subtotal: number;
  igv: number;
  total: number;
  observations?: string;
  paymentType: 'contado' | 'credito';
  creditType?: 'factura' | 'letras';
  installments?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  // Populated fields
  client?: Client;
  salesperson?: User;
  createdByUser?: User;
  installmentDetails?: OrderInstallment[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
  // Populated fields
  product?: Product;
};

export type OrderStatusLog = {
  id: string;
  orderId: string;
  status: string;
  observations?: string;
  hasObservations: boolean;
  createdBy: string;
  createdAt: string;
  // Populated fields
  createdByUser?: User;
};

export type OrderInstallment = {
  id: string;
  orderId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  daysDue: number;
  createdAt: string;
};