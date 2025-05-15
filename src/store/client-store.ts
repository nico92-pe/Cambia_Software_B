import { create } from 'zustand';
import { Client } from '../lib/types';
import { delay } from '../lib/utils';

// Mock initial data
const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    ruc: '20123456789',
    businessName: 'Comercial Los Andes S.A.C.',
    commercialName: 'Comercial Los Andes',
    address: 'Av. Industrial 567',
    district: 'San Juan de Lurigancho',
    province: 'Lima',
    salespersonId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    ruc: '20987654321',
    businessName: 'Distribuidora Norte Peruano E.I.R.L.',
    commercialName: 'Disnorpe',
    address: 'Jr. Lambayeque 234',
    district: 'Chiclayo Centro',
    province: 'Chiclayo',
    salespersonId: '2',
    transport: 'Transportes Chiclayo',
    transportAddress: 'Av. Bolognesi 789',
    transportDistrict: 'Chiclayo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  getClients: () => Promise<void>;
  getClientById: (id: string) => Promise<Client | undefined>;
  getClientsBySalesperson: (salespersonId: string) => Promise<Client[]>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: INITIAL_CLIENTS,
  isLoading: false,
  error: null,
  
  getClients: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      // In a real app, we would fetch from an API
      // No need to modify state here as we're using the initial data
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar clientes'
      });
    }
  },
  
  getClientById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      
      const client = get().clients.find(c => c.id === id);
      set({ isLoading: false });
      
      return client;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar cliente'
      });
    }
  },
  
  getClientsBySalesperson: async (salespersonId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      
      const filteredClients = get().clients.filter(c => c.salespersonId === salespersonId);
      set({ isLoading: false });
      
      return filteredClients;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar clientes'
      });
      return [];
    }
  },
  
  createClient: async (clientData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        clients: [...state.clients, newClient],
        isLoading: false
      }));
      
      return newClient;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear cliente'
      });
      throw error;
    }
  },
  
  updateClient: async (id, clientData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      let updatedClient: Client | undefined;
      
      set(state => {
        const updatedClients = state.clients.map(client => {
          if (client.id === id) {
            updatedClient = {
              ...client,
              ...clientData,
              updatedAt: new Date().toISOString()
            };
            return updatedClient;
          }
          return client;
        });
        
        return {
          clients: updatedClients,
          isLoading: false
        };
      });
      
      if (!updatedClient) {
        throw new Error('Cliente no encontrado');
      }
      
      return updatedClient;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar cliente'
      });
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      set(state => ({
        clients: state.clients.filter(client => client.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar cliente'
      });
      throw error;
    }
  }
}));