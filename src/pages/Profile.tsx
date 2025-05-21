import React from 'react';
import { useForm } from 'react-hook-form';
import { AtSign, Calendar, Phone, User } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/Avatar';
import { formatPhoneNumber } from '../lib/utils';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  cargo: string;
}

export function Profile() {
  const { user, updateProfile, isLoading, error } = useAuthStore();
  const [success, setSuccess] = React.useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birthday: user?.birthday || '',
      cargo: user?.cargo || '',
    },
  });
  
  React.useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        birthday: user.birthday || '',
        cargo: user.cargo,
      });
    }
  }, [user, reset]);
  
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      // Error handled by store
    }
  };

  const getRoleDisplay = (role: string): string => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrador';
      case 'admin':
        return 'Administrador';
      case 'asesor_ventas':
        return 'Asesor de Ventas';
      default:
        return role;
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Actualiza tus datos personales
        </p>
      </header>
      
      {success && (
        <Alert variant="success" className="mb-6 animate-in fade-in duration-300">
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="animate-in fade-in duration-500">
          <div className="card">
            <div className="card-content flex flex-col items-center pt-6">
              <Avatar 
                name={user?.fullName} 
                size="xl" 
                className="mb-4" 
              />
              <h2 className="text-xl font-semibold">{user?.fullName}</h2>
              <p className="text-muted-foreground">{user?.cargo}</p>
              
              <div className="w-full mt-6 pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.phone || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {user?.birthday
                        ? new Date(user.birthday).toLocaleDateString('es-PE')
                        : 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Datos Personales</h2>
              <p className="card-description">
                Actualiza tu información de perfil
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <User size={18} />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      className={`input pl-10 ${errors.fullName ? 'border-destructive' : ''}`}
                      {...register('fullName', {
                        required: 'El nombre es requerido',
                      })}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <AtSign size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      className={`input pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      {...register('email', {
                        required: 'El correo es requerido',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Correo electrónico inválido',
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium">
                    Celular
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Phone size={18} />
                    </div>
                    <input
                      id="phone"
                      type="text"
                      className={`input pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                      {...register('phone', {
                        required: 'El celular es requerido',
                        pattern: {
                          value: /^\+51\s\d{3}\s\d{3}\s\d{3}$/,
                          message: 'Formato: +51 ### ### ###',
                        },
                        onChange: (e) => {
                          e.target.value = formatPhoneNumber(e.target.value);
                        },
                      })}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="birthday" className="block text-sm font-medium">
                    Cumpleaños
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Calendar size={18} />
                    </div>
                    <input
                      id="birthday"
                      type="date"
                      className={`input pl-10 ${errors.birthday ? 'border-destructive' : ''}`}
                      {...register('birthday')}
                    />
                  </div>
                  {errors.birthday && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.birthday.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Rol
                  </label>
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={user?.role ? getRoleDisplay(user.role) : ''}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="cargo" className="block text-sm font-medium">
                    Cargo
                  </label>
                  <input
                    id="cargo"
                    type="text"
                    className={`input ${errors.cargo ? 'border-destructive' : ''}`}
                    {...register('cargo', {
                      required: 'El cargo es requerido',
                    })}
                  />
                  {errors.cargo && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.cargo.message}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-4 pt-2">
                  <Button 
                    type="submit" 
                    disabled={!isDirty}
                    loading={isLoading}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}