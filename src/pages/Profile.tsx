import React from 'react';
import { useForm } from 'react-hook-form';
import { AtSign, Calendar, Phone, User, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { UserRole } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

interface ProfileFormData {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  cargo: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export function Profile() {
  const { user, updateProfile, updatePassword, isLoading, error } = useAuthStore();
  const [success, setSuccess] = React.useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const isAsesorVentas = user?.role === UserRole.ASESOR_VENTAS;

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

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

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

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordError(null);
      await updatePassword(data.newPassword);
      setPasswordSuccess('Contraseña actualizada correctamente');
      resetPassword();
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Actualiza tus datos personales y contraseña
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

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-in fade-in duration-500">
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
                      placeholder="+51 999 888 777"
                      {...register('phone', {
                        required: 'El celular es requerido',
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
                    value={user?.role || ''}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cargo" className="block text-sm font-medium">
                    Cargo
                  </label>
                  {isAsesorVentas ? (
                    <input
                      id="cargo"
                      type="text"
                      className="input bg-gray-50"
                      value={user?.cargo || ''}
                      disabled
                      readOnly
                    />
                  ) : (
                    <>
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
                    </>
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

        <div className="animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Cambiar Contraseña</h2>
              <p className="card-description">
                Actualiza tu contraseña de acceso
              </p>
            </div>
            <div className="card-content">
              {passwordSuccess && (
                <Alert variant="success" className="mb-6 animate-in fade-in duration-300">
                  {passwordSuccess}
                </Alert>
              )}

              {passwordError && (
                <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
                  {passwordError}
                </Alert>
              )}

              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Lock size={18} />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      className={`input pl-10 ${passwordErrors.newPassword ? 'border-destructive' : ''}`}
                      placeholder="Ingresa tu nueva contraseña"
                      {...registerPassword('newPassword', {
                        required: 'La nueva contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'La contraseña debe tener al menos 6 caracteres',
                        },
                      })}
                    />
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-destructive text-sm mt-1">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Lock size={18} />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      className={`input pl-10 ${passwordErrors.confirmPassword ? 'border-destructive' : ''}`}
                      placeholder="Confirma tu nueva contraseña"
                      {...registerPassword('confirmPassword', {
                        required: 'Debes confirmar tu contraseña',
                        validate: (value) =>
                          value === newPassword || 'Las contraseñas no coinciden',
                      })}
                    />
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-destructive text-sm mt-1">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    La contraseña debe tener al menos 6 caracteres.
                  </p>
                </div>

                <div className="flex justify-end space-x-4 pt-2">
                  <Button
                    type="submit"
                    loading={isLoading}
                  >
                    Cambiar Contraseña
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
