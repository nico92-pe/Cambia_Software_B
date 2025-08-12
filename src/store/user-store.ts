import { create } from 'zustand';
import { User, UserRole } from '../lib/types';
import { supabase, adminListUsers, adminCreateUser, adminDeleteUser, getCurrentSession } from '../lib/supabase';

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
      // Get profiles with the specified role
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role);
        
      if (error) throw error;
      
      // Get all auth users to get email addresses
      let authUsers = [];
      try {
        const { users } = await adminListUsers();
        authUsers = users;
      } catch (adminError) {
        console.warn('Could not fetch auth users, using profiles only:', adminError);
      }
      
      const formattedUsers: User[] = profiles.map(profile => ({
        id: profile.id,
        fullName: profile.full_name,
        email: authUsers.find(u => u.id === profile.id)?.email || 'No disponible',
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
      
      // Generate a temporary password using email
      const tempPassword = userData.email.split('@')[0];
      
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

      // Send welcome email with credentials
      const session = await getCurrentSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const functionUrl = new URL('/functions/v1/send-email', import.meta.env.VITE_SUPABASE_URL).toString();
      try {
        const emailResult = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: userData.email,
            subject: 'Bienvenido a Cambia - Credenciales de acceso',
            content: `
              <h2>Bienvenido a Cambia</h2>
              <p>Se ha creado una cuenta para ti en el sistema Cambia. Aquí están tus credenciales de acceso:</p>
              <p><strong>Email:</strong> ${userData.email}</p>
              <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
              <p>Por razones de seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
              <p>Si tienes alguna pregunta, no dudes en contactar al administrador del sistema.</p>
            `
          })
        });

        if (!emailResult.ok) {
          const error = await emailResult.json();
          console.warn('No se pudo enviar el email de bienvenida:', error);
          
          // Show a warning but don't fail the user creation
          if (error.error?.includes('SendGrid API key not configured')) {
            console.warn('SendGrid no está configurado. El usuario fue creado exitosamente pero no se envió el email de bienvenida.');
          }
        }
      } catch (emailError) {
        console.warn('Error al enviar email de bienvenida:', emailError);
        // Don't throw here since the user was created successfully
      }
      
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
      // Update user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userData.fullName,
          phone: userData.phone,
          birthday: userData.birthday,
          cargo: userData.cargo,
          role: userData.role,
          updated_at: new Date().toISOString()
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
      
      // Refresh the users list to ensure UI is updated
      await get().getUsers();
      
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