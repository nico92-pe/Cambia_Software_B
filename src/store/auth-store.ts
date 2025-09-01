import { create } from 'zustand';
import { User, UserRole } from '../lib/types';
import { signIn as supabaseSignIn, signOut as supabaseSignOut, getCurrentUser, supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as true since we'll check auth status on init
  error: null,
  
  initialize: async () => {
    try {
      const supabaseUser = await getCurrentUser();
      
      if (!supabaseUser) {
        set({ isLoading: false });
        return;
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Map Supabase user to our User type
      const appUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        fullName: profile.full_name,
        phone: profile.phone,
        birthday: profile.birthday,
        cargo: profile.cargo,
        role: profile.role as UserRole,
      };
      
      set({
        user: appUser,
        isAuthenticated: true,
        isLoading: false
      });
      
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al inicializar sesión'
      });
    }
  },
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const { user } = await supabaseSignIn(email, password);
      
      if (!user) throw new Error('No se pudo iniciar sesión');
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Map Supabase user to our User type
      const appUser: User = {
        id: user.id,
        email: user.email!,
        fullName: profile.full_name,
        phone: profile.phone,
        birthday: profile.birthday,
        cargo: profile.cargo,
        role: profile.role as UserRole,
      };
      
      set({
        user: appUser,
        isAuthenticated: true,
        isLoading: false
      });
      
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de autenticación'
      });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await supabaseSignOut();
    } catch (error) {
      // Log the error but don't throw it - we still want to clear local state
      console.warn('Error during Supabase logout:', error);
    } finally {
      // Always clear the local authentication state regardless of Supabase logout success
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },
  
  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    
    try {
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        throw new Error('No hay usuario autenticado');
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          phone: userData.phone,
          birthday: userData.birthday,
          cargo: userData.cargo,
        })
        .eq('id', currentUser.id)
        .select()
        .single();
        
      if (error) throw error;
      
      set(state => ({
        user: state.user ? { 
          ...state.user,
          fullName: profile.full_name,
          phone: profile.phone,
          birthday: profile.birthday,
          cargo: profile.cargo,
        } : null,
        isLoading: false
      }));
      
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar perfil'
      });
      throw error;
    }
  }
}));