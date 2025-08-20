import { create } from 'zustand';
import { User, UserRole } from '../lib/types';
import { supabase, adminListUsers, adminCreateUser, adminUpdateUser, adminDeleteUser, getCurrentSession } from '../lib/supabase';

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
    console.log('getUsersByRole called with role:', role);
    
    try {
      // Get profiles with the specified role
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role);
        
      if (error) throw error;
      
      console.log(`Profiles found with ${role} role:`, profiles);
      
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
      
      console.log('Formatted users:', formattedUsers);
      return formattedUsers;
    } catch (error) {
      console.error('Error in getUsersByRole:', error);
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
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>Bienvenido a Cambia</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Bienvenido a Cambia</h2>
                  <p>Se ha creado una cuenta para ti en el sistema Cambia. Aquí están tus credenciales de acceso:</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
                  </div>
                  <p>Por razones de seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
                  <p>Si tienes alguna pregunta, no dudes en contactar al administrador del sistema.</p>
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="font-size: 12px; color: #6b7280;">
                    Este es un mensaje automático, por favor no responder a este correo.
                  </p>
                </div>
              </body>
              </html>
            `
          })
        });

        if (!emailResult.ok) {
          const error = await emailResult.json();
          console.error('Error sending welcome email:', error);
          
          // Show a warning but don't fail the user creation
          if (error.error?.includes('not configured')) {
            console.warn('Email service not configured. User created successfully but welcome email was not sent.');
          } else {
            console.warn('Failed to send welcome email:', error.error);
          }
        } else {
          console.log('Welcome email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
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
      // Update user profile through edge function
      const { profile } = await adminUpdateUser(id, {
        full_name: userData.fullName,
        phone: userData.phone,
        birthday: userData.birthday,
        cargo: userData.cargo,
      });
      
      console.log('User updated in Supabase:', profile);
      
      let updatedUser: User | undefined;
      
      // Refresh the users list to get updated data
      await get().getUsers();
      
      // Find the updated user in the refreshed list
      updatedUser = get().users.find(user => user.id === id);
      if (!updatedUser) throw new Error('Usuario no encontrado');
      
      set({ isLoading: false });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
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