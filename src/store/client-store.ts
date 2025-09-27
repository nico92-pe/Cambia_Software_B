import { create } from 'zustand';
import { Client } from '../lib/types';
import { supabase } from '../lib/supabase';

interface ClientState {
  clients: Client[];
  totalClients: number;
  isLoading: boolean;
  error: string | null;
  getClients: (page?: number, pageSize?: number, searchTerm?: string) => Promise<void>;
  getClientById: (id: string) => Promise<Client | undefined>;
  getClientsBySalesperson: (salespersonId: string) => Promise<Client[]>;
  createClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

// Helper function to map database row to Client type
const mapDbRowToClient = (row: any): Client => ({
  id: row.id,
  ruc: row.ruc,
  businessName: row.business_name,
  commercialName: row.commercial_name,
  contactName: row.contact_name,
  contactPhone: row.contact_phone,
  contactName2: row.contact_name_2,
  contactPhone2: row.contact_phone_2,
  address: row.address,
  district: row.district,
  province: row.province,
  reference: row.reference,
  salespersonId: row.salesperson_id,
  transport: row.transport,
  transportAddress: row.transport_address,
  transportDistrict: row.transport_district,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to map Client type to database insert/update format
const mapClientToDbFormat = (client: Partial<Client>) => ({
  ruc: client.ruc,
  business_name: client.businessName,
  commercial_name: client.commercialName,
  contact_name: client.contactName,
  contact_phone: client.contactPhone,
  contact_name_2: client.contactName2,
  contact_phone_2: client.contactPhone2,
  address: client.address,
  district: client.district,
  province: client.province,
  reference: client.reference,
  salesperson_id: client.salespersonId,
  transport: client.transport,
  transport_address: client.transportAddress,
  transport_district: client.transportDistrict,
});

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  totalClients: 0,
  isLoading: false,
  error: null,
  
  getClients: async (page = 1, pageSize = 10, searchTerm = '') => {
    set({ isLoading: true, error: null });
    
    try {
      // Build the query
      let query = supabase
        .from('clients')
        .select('*', { count: 'exact' });
      
      // Apply search filter
      if (searchTerm) {
        query = query.or(`business_name.ilike.%${searchTerm}%,commercial_name.ilike.%${searchTerm}%,ruc.ilike.%${searchTerm}%`);
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .range(from, to)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const clients = data.map(mapDbRowToClient);
      set({ 
        clients, 
        totalClients: count || 0,
        isLoading: false 
      });
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          set({ isLoading: false });
          return undefined;
        }
        throw error;
      }
      
      const client = mapDbRowToClient(data);
      set({ isLoading: false });
      return client;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar cliente'
      });
      return undefined;
    }
  },
  
  getClientsBySalesperson: async (salespersonId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('salesperson_id', salespersonId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const clients = data.map(mapDbRowToClient);
      set({ isLoading: false });
      return clients;
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
      const dbData = mapClientToDbFormat(clientData);
      
      const { data, error } = await supabase
        .from('clients')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      const newClient = mapDbRowToClient(data);
      
      set(state => ({
        clients: [newClient, ...state.clients],
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
      const dbData = mapClientToDbFormat(clientData);
      
      const { data, error } = await supabase
        .from('clients')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedClient = mapDbRowToClient(data);
      
      set(state => ({
        clients: state.clients.map(client => 
          client.id === id ? updatedClient : client
        ),
        isLoading: false
      }));
      
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
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
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