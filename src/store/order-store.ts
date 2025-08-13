import { create } from 'zustand';
import { Order, OrderItem, OrderStatus, OrderStatusLog } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useUserStore } from './user-store';

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
});

// Helper function to map OrderItem type to database format
const mapOrderItemToDbFormat = (item: Partial<OrderItem>) => ({
  order_id: item.orderId,
  product_id: item.productId,
  quantity: item.quantity,
  unit_price: item.unitPrice,
});

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Order operations
  getOrders: () => Promise<void>;
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
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  
  getOrders: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Get orders with basic relations and profiles joined
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(
            *,
            salesperson:profiles(id, full_name, phone, cargo, role)
          ),
          salesperson:profiles(id, full_name, phone, cargo, role),
          order_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      const orders = data.map(row => {
        const order = mapDbRowToOrder(row);
        
        // Map client data  
        if (row.client) {
          order.client = {
            id: row.client.id, 
            ruc: row.client.ruc,
            businessName: row.client.business_name,
            commercialName: row.client.commercial_name,
            address: row.client.address,
            district: row.client.district,
            province: row.client.province,
            salespersonId: row.client.salesperson_id,
            salesperson: row.client.salesperson ? {
              id: row.client.salesperson.id,
              fullName: row.client.salesperson.full_name,
              email: '',
              phone: row.client.salesperson.phone,
              birthday: '',
              cargo: row.client.salesperson.cargo,
              role: row.client.salesperson.role,
            } : undefined,
            transport: row.client.transport,
            transportAddress: row.client.transport_address,
            transportDistrict: row.client.transport_district,
            createdAt: row.client.created_at,
            updatedAt: row.client.updated_at,
          };
        }
        
        // Map salesperson data from joined profile
        if (row.salesperson) {
          order.salesperson = {
            id: row.salesperson.id,
            fullName: row.salesperson.full_name,
            email: '',
            phone: row.salesperson.phone,
            birthday: row.salesperson.birthday || '',
            cargo: row.salesperson.cargo,
            role: row.salesperson.role,
          };
        }
        
        // Map order items
        order.items = (row.order_items || []).map(item => {
          const orderItem = mapDbRowToOrderItem(item);
          orderItem.product = item.product || null;
          return orderItem;
        });
        
        return order;
      });
      
      set({ orders, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar pedidos'
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
            salesperson:profiles(id, full_name, phone, cargo, role)
          ),
          salesperson:profiles(id, full_name, phone, cargo, role),
          order_items(
            *,
            product:products(*)
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
          address: data.client.address,
          district: data.client.district,
          province: data.client.province,
          salespersonId: data.client.salesperson_id,
          salesperson: data.client.salesperson ? {
            id: data.client.salesperson.id,
            fullName: data.client.salesperson.full_name,
            email: '',
            phone: data.client.salesperson.phone,
            birthday: '',
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
      
      // Map salesperson data from joined profile
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
        
      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
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
}));