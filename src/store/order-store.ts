import { create } from 'zustand';
import { Order, OrderItem, OrderStatus, OrderStatusLog } from '../lib/types';
import { supabase } from '../lib/supabase';

// Helper function to map database row to Order type
const mapDbRowToOrder = (row: any): Order => ({
  id: row.id || '',
  clientId: row.client_id,
  salespersonId: row.salesperson_id,
  status: row.status as OrderStatus,
  subtotal: parseFloat(row.subtotal || '0'),
  igv: parseFloat(row.igv || '0'),
  total: parseFloat(row.total || '0'),
  observations: row.observations,
  paymentType: row.payment_type || 'contado',
  creditType: row.credit_type,
  installments: row.installments,
  createdBy: row.created_by,
  createdAt: row.created_at || '',
  updatedAt: row.updated_at || '',
  items: [],
  // Populated fields will be added separately
});

// Helper function to map database row to OrderItem type
const mapDbRowToOrderItem = (row: any): OrderItem => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  quantity: row.quantity,
  unitPrice: parseFloat(row.unit_price),
  subtotal: parseFloat(row.subtotal),
  createdAt: row.created_at,
});

// Helper function to map Order type to database format
const mapOrderToDbFormat = (order: Partial<Order>) => ({
  client_id: order.clientId,
  salesperson_id: order.salespersonId,
  status: order.status,
  observations: order.observations,
  created_by: order.createdBy,
  payment_type: order.paymentType,
  credit_type: order.creditType,
  installments: order.installments,
});

// Helper function to map OrderItem type to database format
const mapOrderItemToDbFormat = (item: Partial<OrderItem>) => ({
  order_id: item.orderId,
  product_id: item.productId,
  quantity: item.quantity,
  unit_price: item.unitPrice,
  subtotal: item.subtotal,
});

// Sales dashboard data types
export interface SalesStats {
  totalSales: number;
  totalOrders: number;
  salesByStatus: Array<{
    status: string;
    statusLabel: string;
    count: number;
    total: number;
  }>;
  salesBySalesperson: Array<{
    salespersonId: string;
    salespersonName: string;
    count: number;
    total: number;
  }>;
  salesByMonth: Array<{
    month: string;
    monthLabel: string;
    total: number;
    count: number;
    byStatus: Record<string, number>;
    bySalesperson: Record<string, number>;
  }>;
}

interface OrderState {
  orders: Order[];
  totalOrders: number;
  currentOrder: Order | null;
  salesDashboardData: Order[];
  salesStats: SalesStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Order operations
  getOrders: (page?: number, pageSize?: number, searchTerm?: string, statusFilter?: string, monthFilter?: string, yearFilter?: string, salespersonFilter?: string) => Promise<void>;
  getOrderById: (id: string) => Promise<Order | undefined>;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'subtotal' | 'igv' | 'total' | 'items'>) => Promise<Order>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus, observations?: string, hasObservations?: boolean) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
  
  // Order item operations
  addOrderItem: (orderId: string, item: Omit<OrderItem, 'id' | 'orderId' | 'subtotal' | 'createdAt'>) => Promise<OrderItem>;
  updateOrderItem: (id: string, itemData: Partial<OrderItem>) => Promise<OrderItem>;
  removeOrderItem: (id: string) => Promise<void>;
  
  // Status log operations
  getOrderStatusLogs: (orderId: string) => Promise<OrderStatusLog[]>;
  
  // Utility
  clearCurrentOrder: () => void;
  setCurrentOrder: (order: Order | null) => void;
  
  // Installments operations
  saveOrderInstallments: (orderId: string, installments: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: string;
    daysDue: number;
  }>) => Promise<void>;
  
  // Dashboard operations
  getSalesDashboardData: (year: number, month?: number) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  totalOrders: 0,
  currentOrder: null,
  salesDashboardData: [],
  salesStats: null,
  isLoading: false,
  error: null,

  getOrders: async (page = 1, pageSize = 10, searchTerm = '', statusFilter = '', monthFilter = '', yearFilter = '', salespersonFilter = '') => {
    set({ isLoading: true, error: null });

    try {
      // Get current user to apply role-based filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Build the query with filters
      let query = supabase
        .from('orders')
        .select(`
          id,
          client_id,
          salesperson_id,
          status,
          subtotal,
          igv,
          total,
          payment_type,
          credit_type,
          installments,
          observations,
          created_by,
          created_at,
          updated_at,
          client:clients(
            id,
            business_name,
            commercial_name,
            ruc
          ),
          salesperson:profiles!orders_salesperson_id_fkey(id, full_name)
        `, { count: 'exact' });
      
      // Apply search filter
      if (searchTerm) {
        // For related table filtering, we need to use a different approach
        // We'll filter by client_id after getting matching clients
        const { data: matchingClients, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .or(`business_name.ilike.%${searchTerm}%,commercial_name.ilike.%${searchTerm}%,ruc.ilike.%${searchTerm}%`);
          
        if (clientError) throw clientError;
        
        if (matchingClients && matchingClients.length > 0) {
          const clientIds = matchingClients.map(c => c.id);
          query = query.in('client_id', clientIds);
        } else {
          // No matching clients found, return empty result
          set({ 
            orders: [], 
            totalOrders: 0,
            isLoading: false 
          });
          return;
        }
      }
      
      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Apply role-based filtering for asesor_ventas
      if (profile.role === 'asesor_ventas') {
        query = query.eq('salesperson_id', user.id);
      } else if (salespersonFilter && salespersonFilter !== 'all') {
        // Apply salesperson filter only for admin and super_admin
        query = query.eq('salesperson_id', salespersonFilter);
      }
      
      // Apply date filters
      if (monthFilter && monthFilter !== 'all' && yearFilter) {
        const year = parseInt(yearFilter);
        const month = parseInt(monthFilter);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      } else if (yearFilter && (!monthFilter || monthFilter === 'all')) {
        const year = parseInt(yearFilter);
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        
        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: ordersData, error: ordersError, count } = await query
        .range(from, to)
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const orders = (ordersData || []).map(row => {
        const order = mapDbRowToOrder(row);
        
        // Map client data
        if (row.client) {
          order.client = {
            id: row.client.id,
            ruc: row.client.ruc || '',
            businessName: row.client.business_name || '',
            commercialName: row.client.commercial_name,
            contactName: '',
            contactPhone: '',
            address: '',
            district: '',
            province: '',
            salespersonId: '',
            createdAt: '',
            updatedAt: '',
          };
        }

        // Map salesperson
        if (row.salesperson) {
          order.salesperson = {
            id: row.salesperson.id,
            fullName: row.salesperson.full_name,
            email: '',
            phone: '',
            birthday: '',
            cargo: '',
            role: 'asesor_ventas',
          };
        }

        // Initialize empty arrays for items and installments (loaded separately when needed)
        order.items = [];
        order.installmentDetails = [];

        return order;
      });

      set({ 
        orders, 
        totalOrders: count || 0,
        isLoading: false 
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar pedidos',
      });
    }
  },

  
  getOrderById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(
            *,
            salesperson:profiles!clients_salesperson_id_fkey(id, full_name, phone, cargo, role, birthday)
          ),
          salesperson:profiles!orders_salesperson_id_fkey(id, full_name, phone, cargo, role, birthday),
          createdByUser:profiles!orders_created_by_fkey(id, full_name, phone, cargo, role, birthday),
          order_items(
            *,
            product:products(*)
          ),
          order_installments(
            *
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          set({ isLoading: false });
          return undefined;
        }
        throw error;
      }
      
      const order = mapDbRowToOrder(data);
      
      // Map client data
      if (data.client) {
        order.client = {
          id: data.client.id,
          ruc: data.client.ruc,
          businessName: data.client.business_name,
          commercialName: data.client.commercial_name,
          contactName: data.client.contact_name,
          contactPhone: data.client.contact_phone,          
          address: data.client.address,
          district: data.client.district,
          province: data.client.province,
          salespersonId: data.client.salesperson_id,
          salesperson: data.client.salesperson ? {
            id: data.client.salesperson.id,
            fullName: data.client.salesperson.full_name,
            email: '',
            phone: data.client.salesperson.phone,
            birthday: data.client.salesperson.birthday || '',
            cargo: data.client.salesperson.cargo,
            role: data.client.salesperson.role,
          } : undefined,
          transport: data.client.transport,
          transportAddress: data.client.transport_address,
          transportDistrict: data.client.transport_district,
          createdAt: data.client.created_at,
          updatedAt: data.client.updated_at,
        };
      }
      
      // Map salesperson from the order itself
      if (data.salesperson) {
        order.salesperson = {
          id: data.salesperson.id,
          fullName: data.salesperson.full_name,
          email: '',
          phone: data.salesperson.phone,
          birthday: data.salesperson.birthday || '',
          cargo: data.salesperson.cargo,
          role: data.salesperson.role,
        };
      }
      
      // Map createdByUser
      if (data.createdByUser) {
        order.createdByUser = {
          id: data.createdByUser.id,
          fullName: data.createdByUser.full_name,
          email: '',
          phone: data.createdByUser.phone,
          birthday: data.createdByUser.birthday || '',
          cargo: data.createdByUser.cargo,
          role: data.createdByUser.role,
        };
      }
      
      // Map order items
      order.items = (data.order_items || []).map(item => {
        const orderItem = mapDbRowToOrderItem(item);
        if (item.product) {
          orderItem.product = {
            id: item.product.id,
            code: item.product.code,
            name: item.product.name,
            wholesalePrice: parseFloat(item.product.wholesale_price),
            retailPrice: parseFloat(item.product.retail_price),
            distributorPrice: parseFloat(item.product.distributor_price),
            creditPrice: parseFloat(item.product.credit_price),
            cashPrice: parseFloat(item.product.cash_price),
            unitsPerBox: item.product.units_per_box,
            categoryId: item.product.category_id,
            stock: item.product.stock,
            imageUrl: item.product.image_url,
            createdAt: item.product.created_at,
            updatedAt: item.product.updated_at,
          };
        }
        return orderItem;
      });
      
      // Map installment details
      if (data.order_installments) {
        order.installmentDetails = data.order_installments.map((inst: any) => ({
          id: inst.id,
          orderId: inst.order_id,
          installmentNumber: inst.installment_number,
          amount: parseFloat(inst.amount),
          dueDate: inst.due_date,
          daysDue: inst.days_due,
          status: inst.status,
          paidAmount: parseFloat(inst.paid_amount || 0),
          paymentDate: inst.payment_date,
          notes: inst.notes,
          createdAt: inst.created_at,
          updatedAt: inst.updated_at,
        }));
      }
      
      set({ isLoading: false });
      return order;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar pedido'
      });
      return undefined;
    }
  },
  
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    
    try {
      const dbData = mapOrderToDbFormat(orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      const newOrder = mapDbRowToOrder(data);
      
      set(state => ({
        orders: [newOrder, ...state.orders],
        isLoading: false
      }));
      
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear pedido'
      });
      throw error;
    }
  },
  
  updateOrder: async (id, orderData) => {
    set({ isLoading: true, error: null });
    
    try {
      const dbData = mapOrderToDbFormat(orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedOrder = mapDbRowToOrder(data);
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? updatedOrder : order
        ),
        isLoading: false
      }));
      
      return updatedOrder;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar pedido'
      });
      throw error;
    }
  },
  
  updateOrderStatus: async (id, status, observations, hasObservations = false) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');
      
      // Update order status
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
        
      if (orderError) throw orderError;
      
      // Log status change
      const { error: logError } = await supabase
        .from('order_status_logs')
        .insert({
          order_id: id,
          status,
          observations,
          has_observations: hasObservations,
          created_by: user.id,
        });
        
      if (logError) throw logError;
      
      const updatedOrder = mapDbRowToOrder(orderData);
      
      set(state => ({
        orders: state.orders.map(order => 
          order.id === id ? { ...order, status } : order
        ),
        isLoading: false
      }));
      
      return updatedOrder;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar estado del pedido'
      });
      throw error;
    }
  },
  
  deleteOrder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      set(state => ({
        orders: state.orders.filter(order => order.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar pedido'
      });
      throw error;
    }
  },
  
  addOrderItem: async (orderId, itemData) => {
    set({ isLoading: true, error: null });
    
    try {
      const dbData = mapOrderItemToDbFormat({ ...itemData, orderId });
      
      const { data, error } = await supabase
        .from('order_items')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      const newItem = mapDbRowToOrderItem(data);
      
      set({ isLoading: false });
      return newItem;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al agregar producto'
      });
      throw error;
    }
  },
  
  updateOrderItem: async (id, itemData) => {
    set({ isLoading: true, error: null });
    
    try {
      const dbData = mapOrderItemToDbFormat(itemData);
      
      const { data, error } = await supabase
        .from('order_items')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedItem = mapDbRowToOrderItem(data);
      
      set({ isLoading: false });
      return updatedItem;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar producto'
      });
      throw error;
    }
  },
  
  removeOrderItem: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar producto'
      });
      throw error;
    }
  },
  
  getOrderStatusLogs: async (orderId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('order_status_logs')
        .select(`
          *,
          created_by_user:profiles!order_status_logs_created_by_fkey(*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      const logs: OrderStatusLog[] = data.map(row => ({
        id: row.id,
        orderId: row.order_id,
        status: row.status,
        observations: row.observations,
        hasObservations: row.has_observations,
        createdBy: row.created_by,
        createdAt: row.created_at,
        
        // Map created by user data
        createdByUser: {
          id: row.created_by_user.id,
          fullName: row.created_by_user.full_name,
          email: '',
          phone: row.created_by_user.phone,
          birthday: row.created_by_user.birthday || '',
          cargo: row.created_by_user.cargo,
          role: row.created_by_user.role,
        },
      }));
      
      set({ isLoading: false });
      return logs;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar historial de estados'
      });
      return [];
    }
  },
  
  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },
  
  setCurrentOrder: (order) => {
    set({ currentOrder: order });
  },
  
  saveOrderInstallments: async (orderId, installments) => {
    set({ isLoading: true, error: null });
    
    try {
      // First, delete existing installments for this order
      const { error: deleteError } = await supabase
        .from('order_installments')
        .delete()
        .eq('order_id', orderId);
        
      if (deleteError) throw deleteError;
      
      // If there are installments to save, insert them
      if (installments.length > 0) {
        const installmentData = installments.map(installment => ({
          order_id: orderId,
          installment_number: installment.installmentNumber,
          amount: installment.amount,
          due_date: installment.dueDate,
          days_due: installment.daysDue,
        }));
        
        const { error: insertError } = await supabase
          .from('order_installments')
          .insert(installmentData);
          
        if (insertError) throw insertError;
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al guardar las cuotas'
      });
      throw error;
    }
  },
  
  getSalesDashboardData: async (year, month) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current user to apply role-based filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');
      
      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Build date range for filtering
      let startDate: Date;
      let endDate: Date;
      
      if (month) {
        // Filter by specific month
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0, 23, 59, 59);
      } else {
        // Filter by entire year
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
      }
      
      // Build the query
      let query = supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          salesperson_id,
          client:clients(
            id,
            business_name,
            commercial_name
          ),
          salesperson:profiles!orders_salesperson_id_fkey(
            id,
            full_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      // Apply role-based filtering
      if (profile.role === 'asesor_ventas') {
        query = query.eq('salesperson_id', user.id);
      }
      
      const { data: ordersData, error: ordersError } = await query;
      
      if (ordersError) throw ordersError;
      
      // Map the data to Order objects
      const orders: Order[] = (ordersData || []).map(row => {
        const order = mapDbRowToOrder(row);
        
        // Map client data
        if (row.client) {
          order.client = {
            id: row.client.id,
            ruc: '',
            businessName: row.client.business_name || '',
            commercialName: row.client.commercial_name || '',
            contactName: '',
            contactPhone: '',
            address: '',
            district: '',
            province: '',
            salespersonId: '',
            createdAt: '',
            updatedAt: '',
          };
        }
        
        // Map salesperson
        if (row.salesperson) {
          order.salesperson = {
            id: row.salesperson.id,
            fullName: row.salesperson.full_name,
            email: '',
            phone: '',
            birthday: '',
            cargo: '',
            role: 'asesor_ventas',
          };
        }
        
        return order;
      });
      
      // Process data for dashboard statistics
      const salesStats = processOrdersForDashboard(orders);
      
      set({ 
        salesDashboardData: orders,
        salesStats,
        isLoading: false 
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos del dashboard'
      });
    }
  },
}));
// Helper function to process orders data for dashboard
function processOrdersForDashboard(orders: Order[]): SalesStats {
  const statusLabels = {
    borrador: 'Borrador',
    tomado: 'Tomado',
    confirmado: 'Confirmado',
    en_preparacion: 'En Preparación',
    despachado: 'Despachado',
  };
  
  const monthLabels = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Calculate total sales and orders
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  
  // Group by status
  const statusGroups = orders.reduce((acc, order) => {
    if (!acc[order.status]) {
      acc[order.status] = { count: 0, total: 0 };
    }
    acc[order.status].count++;
    acc[order.status].total += order.total;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);
  
  const salesByStatus = Object.entries(statusGroups).map(([status, data]) => ({
    status,
    statusLabel: statusLabels[status as keyof typeof statusLabels] || status,
    count: data.count,
    total: data.total,
  }));
  
  // Group by salesperson
  const salespersonGroups = orders.reduce((acc, order) => {
    const salespersonId = order.salespersonId;
    const salespersonName = order.salesperson?.fullName || 'Sin vendedor';
    
    if (!acc[salespersonId]) {
      acc[salespersonId] = { 
        salespersonName,
        count: 0, 
        total: 0 
      };
    }
    acc[salespersonId].count++;
    acc[salespersonId].total += order.total;
    return acc;
  }, {} as Record<string, { salespersonName: string; count: number; total: number }>);
  
  const salesBySalesperson = Object.entries(salespersonGroups).map(([salespersonId, data]) => ({
    salespersonId,
    salespersonName: data.salespersonName,
    count: data.count,
    total: data.total,
  }));
  
  // Group by month
  const monthGroups = orders.reduce((acc, order) => {
    const orderDate = new Date(order.createdAt);
    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = monthLabels[orderDate.getMonth()];
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        monthLabel,
        total: 0,
        count: 0,
        byStatus: {},
        bySalesperson: {},
      };
    }
    
    acc[monthKey].total += order.total;
    acc[monthKey].count++;
    
    // Group by status within month
    if (!acc[monthKey].byStatus[order.status]) {
      acc[monthKey].byStatus[order.status] = 0;
    }
    acc[monthKey].byStatus[order.status] += order.total;
    
    // Group by salesperson within month
    const salespersonName = order.salesperson?.fullName || 'Sin vendedor';
    if (!acc[monthKey].bySalesperson[salespersonName]) {
      acc[monthKey].bySalesperson[salespersonName] = 0;
    }
    acc[monthKey].bySalesperson[salespersonName] += order.total;
    
    return acc;
  }, {} as Record<string, {
    month: string;
    monthLabel: string;
    total: number;
    count: number;
    byStatus: Record<string, number>;
    bySalesperson: Record<string, number>;
  }>);
  
  const salesByMonth = Object.values(monthGroups).sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    totalSales,
    totalOrders,
    salesByStatus,
    salesBySalesperson,
    salesByMonth,
  };
}