import { create } from 'zustand';
import { User, UserRole } from '../lib/types';
import { supabase, adminListUsers, adminCreateUser, adminDeleteUser } from '../lib/supabase';

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  getUsers: () => Promise<void>;
  getUsersByRole: (role: UserRole) => Promise<User[]>;
  createUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  
  getUsers: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // First check if current user has super_admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      if (profile.role !== 'super_admin') {
        throw new Error('Acceso no autorizado - Solo Super Admin puede acceder a esta función');
      }
      
      // Get users through edge function
      const { users, profiles } = await adminListUsers();
      
      const formattedUsers: User[] = profiles.map(profile => ({
        id: profile.id,
        fullName: profile.full_name,
        email: users.find(u => u.id === profile.id)?.email || '',
        phone: profile.phone,
        birthday: profile.birthday,
        cargo: profile.cargo,
        role: profile.role as UserRole,
      }));
      
      set({ users: formattedUsers, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar usuarios'
      });
    }
  },
  
  getUsersByRole: async (role) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role);
        
      if (error) throw error;
      
      const { users } = await adminListUsers();
      
      const formattedUsers: User[] = profiles.map(profile => ({
        id: profile.id,
        fullName: profile.full_name,
        email: users.find(u => u.id === profile.id)?.email || '',
        phone: profile.phone,
        birthday: profile.birthday,
        cargo: profile.cargo,
        role: profile.role as UserRole,
      }));
      
      set({ isLoading: false });
      return formattedUsers;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar usuarios'
      });
      return [];
    }
  },
  
  createUser: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Validate required fields
      if (!userData.fullName || !userData.email || !userData.phone || !userData.cargo || !userData.role) {
        throw new Error('Todos los campos son requeridos');
      }
      
      // Validate role is one of the allowed values
      if (!['super_admin', 'admin', 'asesor_ventas'].includes(userData.role)) {
        throw new Error('Rol no válido');
      }
      
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create user through edge function
      const { user, profile } = await adminCreateUser({
        email: userData.email,
        password: tempPassword,
        metadata: {
          full_name: userData.fullName,
          phone: userData.phone,
          birthday: userData.birthday,
          cargo: userData.cargo,
          role: userData.role,
          must_change_password: true
        }
      });
      
      const newUser: User = {
        id: user.id,
        ...userData
      };
      
      set(state => ({
        users: [...state.users, newUser],
        isLoading: false
      }));
      
      // TODO: Send email with credentials
      console.log('Temporary credentials:', {
        email: userData.email,
        password: tempPassword
      });
      
      return newUser;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear usuario'
      });
      throw error;
    }
  },
  
  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          phone: userData.phone,
          birthday: userData.birthday,
          cargo: userData.cargo,
          role: userData.role,
        })
        .eq('id', id);
      
      if (error) throw error;
      
      let updatedUser: User | undefined;
      
      set(state => {
        const updatedUsers = state.users.map(user => {
          if (user.id === id) {
            updatedUser = { ...user, ...userData };
            return updatedUser;
          }
          return user;
        });
        
        return {
          users: updatedUsers,
          isLoading: false
        };
      });
      
      if (!updatedUser) throw new Error('Usuario no encontrado');
      return updatedUser;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar usuario'
      });
      throw error;
    }
  },
  
  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      await adminDeleteUser(id);
      
      set(state => ({
        users: state.users.filter(user => user.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar usuario'
      });
      throw error;
    }
  }
}));