import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, AtSign, Calendar, Phone, Save, User as UserIcon } from 'lucide-react';
import type { User } from '../../lib/types';
import { UserRole } from '../../lib/types';
import { useUserStore } from '../../store/user-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { formatPhoneNumber } from '../../lib/utils';

type UserFormData = Omit<User, 'id'>;

export function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, createUser, updateUser, isLoading, error } = useUserStore();
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormData>();

  useEffect(() => {
    if (id) {
      const user = users.find(u => u.id === id);
      if (user) {
        reset(user);
      } else {
        navigate('/users');
      }
    }
  }, [id, users, reset, navigate]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditMode && id) {
        await updateUser(id, data);
      } else {
        await createUser(data);
      }
      navigate('/users');
    } catch (error) {
      // Error handled by store
    }
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Actualiza la información del usuario' : 'Crea un nuevo usuario en el sistema'}
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/users')}
        >
          Volver
        </Button>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header">
          <h2 className="card-title text-xl">Información del Usuario</h2>
          <p className="card-description">
            Ingresa los datos del usuario
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <UserIcon size={18} />
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
                  Correo Electrónico *
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
                  Celular *
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
                    })}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      e.target.value = formatted;
                    }}
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
                <label htmlFor="cargo" className="block text-sm font-medium">
                  Cargo *
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

              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium">
                  Rol *
                </label>
                <select
                  id="role"
                  className={`select ${errors.role ? 'border-destructive' : ''}`}
                  {...register('role', {
                    required: 'El rol es requerido',
                  })}
                >
                  <option value="">Seleccionar rol</option>
                  <option value={UserRole.ADMIN}>Administrador</option>
                  <option value={UserRole.ASESOR_VENTAS}>Asesor de Ventas</option>
                </select>
                {errors.role && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={<Save size={18} />}
                loading={isLoading}
              >
                {isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}