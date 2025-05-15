import { create } from 'zustand';
import { Order, OrderItem, OrderStatus } from '../lib/types';
import { delay } from '../lib/utils';

// Mock initial data
const INITIAL_ORDERS: Order[] = [
  {
    id: '1',
    clientId: '1',
    salespersonId: '2',
    status: OrderStatus.PENDING,
    total: 3500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: '1',
        orderId: '1',
        productId: '1',
        quantity: 1,
        price: 1700,
        subtotal: 1700
      },
      {
        id: '2',
        orderId: '1',
        productId: '2',
        quantity: 4,
        price: 450,
        subtotal: 1800
      }
    ]
  }
];

interface OrderState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  getOrders: () => Promise<void>;
  getOrdersByClient: (clientId: string) => Promise<Order[]>;
  getOrdersBySalesperson: (salespersonId: string) => Promise<Order[]>;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<Order>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: INITIAL_ORDERS,
  isLoading: false,
  error: null,
  
  getOrders: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      // In a real app, we would fetch from an API
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar pedidos'
      });
    }
  },
  
  getOrdersByClient: async (clientId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      
      const filteredOrders = get().orders.filter(o => o.clientId === clientId);
      set({ isLoading: false });
      
      return filteredOrders;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar pedidos'
      });
      return [];
    }
  },
  
  getOrdersBySalesperson: async (salespersonId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      
      const filteredOrders = get().orders.filter(o => o.salespersonId === salespersonId);
      set({ isLoading: false });
      
      return filteredOrders;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar pedidos'
      });
      return [];
    }
  },
  
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      const newOrder: Order = {
        ...orderData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        orders: [...state.orders, newOrder],
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
  
  updateOrderStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      
      let updatedOrder: Order | undefined;
      
      set(state => {
        const updatedOrders = state.orders.map(order => {
          if (order.id === id) {
            updatedOrder = {
              ...order,
              status,
              updatedAt: new Date().toISOString()
            };
            return updatedOrder;
          }
          return order;
        });
        
        return {
          orders: updatedOrders,
          isLoading: false
        };
      });
      
      if (!updatedOrder) {
        throw new Error('Pedido no encontrado');
      }
      
      return updatedOrder;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar pedido'
      });
      throw error;
    }
  },
  
  deleteOrder: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
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
  }
}));