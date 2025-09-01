import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Building, Building2, MapPin, Save, User as UserIcon, Phone } from 'lucide-react';
import { Client } from '../../lib/types';
import { useClientStore } from '../../store/client-store';
import { useUserStore } from '../../store/user-store';
import { useAuthStore } from '../../store/auth-store';
import { UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';

type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export function ClientForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClientById, createClient, updateClient, isLoading, error } = useClientStore();
  const { users, getUsers } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const [salespeople, setSalespeople] = useState<{ id: string; fullName: string }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const isEditMode = Boolean(id);
  const isCurrentUserSalesperson = currentUser?.role === UserRole.ASESOR_VENTAS;

  // Show loading screen during initial data load
  if (isLoading && !isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ClientFormData>();

  const province = watch('province');
  const isLima = province === 'Lima' || province === '';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all users first
        await getUsers();
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    const loadClient = async () => {
      if (id) {
        try {
          setFormError(null);
          const client = await getClientById(id);
          if (client) {
            reset(client);
          } else {
            setFormError('Cliente no encontrado');
            navigate('/clients');
          }
        } catch (error) {
          setFormError('Error al cargar el cliente');
        }
      } else if (isCurrentUserSalesperson && currentUser) {
        // For new clients, pre-fill salesperson if current user is a salesperson
        reset({
          salespersonId: currentUser.id,
        } as ClientFormData);
      }
    };

    loadData();
    loadClient();
  }, [id, getClientById, getUsers, reset, navigate, isCurrentUserSalesperson, currentUser]);

  // Filter salespeople from loaded users
  useEffect(() => {
    const filteredSalespeople = users
      .filter(user => user.role === UserRole.ASESOR_VENTAS)
      .map(s => ({ id: s.id, fullName: s.fullName }));
    
    console.log('All users:', users);
    console.log('Filtered salespeople:', filteredSalespeople);
    setSalespeople(filteredSalespeople);
  }, [users]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setFormError(null);
      
      if (isEditMode && id) {
        await updateClient(id, data);
      } else {
        await createClient(data);
      }
      
      navigate('/clients');
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Error al guardar el cliente');
      }
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
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Actualiza la información del cliente' : 'Registra un nuevo cliente en el sistema'}
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/clients')}
        >
          Volver
        </Button>
      </header>

      {(error || formError) && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error || formError}
        </Alert>
      )}

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header">
          <h2 className="card-title text-xl">Información del Cliente</h2>
          <p className="card-description">
            Ingresa los datos del cliente
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="ruc" className="block text-sm font-medium">
                  RUC *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Building size={18} />
                  </div>
                  <input
                    id="ruc"
                    type="text"
                    className={`input pl-10 ${errors.ruc ? 'border-destructive' : ''}`}
                    {...register('ruc', {
                      required: 'El RUC es requerido',
                      pattern: {
                        value: /^[0-9]{11}$/,
                        message: 'El RUC debe tener 11 dígitos',
                      },
                    })}
                  />
                </div>
                {errors.ruc && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.ruc.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonId" className="block text-sm font-medium">
                  Vendedor Asignado *
                </label>
                {isCurrentUserSalesperson ? (
                  <div>
                    <input
                      type="text"
                      className="input bg-gray-50"
                      value={currentUser?.fullName || ''}
                      disabled
                      readOnly
                    />
                    <input
                      type="hidden"
                      {...register('salespersonId', {
                        required: 'El vendedor es requerido',
                      })}
                      value={currentUser?.id || ''}
                    />
                  </div>
                ) : (
                  <select
                    id="salespersonId"
                    className={`select ${errors.salespersonId ? 'border-destructive' : ''}`}
                    {...register('salespersonId', {
                      required: 'El vendedor es requerido',
                    })}
                  >
                    <option value="">Seleccionar vendedor</option>
                    {salespeople.map((salesperson) => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.fullName}
                      </option>
                    ))}
                  </select>
                )}
                {errors.salespersonId && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.salespersonId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="businessName" className="block text-sm font-medium">
                  Razón Social *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Building2 size={18} />
                  </div>
                  <input
                    id="businessName"
                    type="text"
                    className={`input pl-10 ${errors.businessName ? 'border-destructive' : ''}`}
                    {...register('businessName', {
                      required: 'La razón social es requerida',
                    })}
                  />
                </div>
                {errors.businessName && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="commercialName" className="block text-sm font-medium">
                  Nombre Comercial *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Building2 size={18} />
                  </div>
                  <input
                    id="commercialName"
                    type="text"
                    className={`input pl-10 ${errors.commercialName ? 'border-destructive' : ''}`}
                    {...register('commercialName', {
                      required: 'El nombre comercial es requerido',
                    })}
                  />
                </div>
                {errors.commercialName && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.commercialName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium text-lg mb-4">Datos de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="contactName" className="block text-sm font-medium">
                    Nombre de Contacto *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <UserIcon size={18} />
                    </div>
                    <input
                      id="contactName"
                      type="text"
                      className={`input pl-10 ${errors.contactName ? 'border-destructive' : ''}`}
                      {...register('contactName', {
                        required: 'El nombre de contacto es requerido',
                      })}
                    />
                  </div>
                  {errors.contactName && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.contactName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactPhone" className="block text-sm font-medium">
                    Celular de Contacto *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Phone size={18} />
                    </div>
                    <input
                      id="contactPhone"
                      type="text"
                      className={`input pl-10 ${errors.contactPhone ? 'border-destructive' : ''}`}
                      placeholder="+51 999 888 777"
                      maxLength={9}
                      {...register('contactPhone', {
                        required: 'El celular de contacto es requerido',
                        pattern: {
                          value: /^[0-9]{9}$/,
                          message: 'El celular debe tener exactamente 9 dígitos',
                        },
                      })}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.contactPhone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactName2" className="block text-sm font-medium">
                    Nombre de Contacto 2
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <UserIcon size={18} />
                    </div>
                    <input
                      id="contactName2"
                      type="text"
                      className={`input pl-10 ${errors.contactName2 ? 'border-destructive' : ''}`}
                      {...register('contactName2')}
                    />
                  </div>
                  {errors.contactName2 && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.contactName2.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactPhone2" className="block text-sm font-medium">
                    Celular de Contacto 2
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Phone size={18} />
                    </div>
                    <input
                      id="contactPhone2"
                      type="text"
                      className={`input pl-10 ${errors.contactPhone2 ? 'border-destructive' : ''}`}
                      placeholder="+51 999 888 777"
                      maxLength={9}
                      {...register('contactPhone2', {
                        pattern: {
                          value: /^[0-9]{9}$/,
                          message: 'El celular debe tener exactamente 9 dígitos',
                        },
                      })}
                    />
                  </div>
                  {errors.contactPhone2 && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.contactPhone2.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium text-lg mb-4">Ubicación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium">
                    Dirección *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <MapPin size={18} />
                    </div>
                    <input
                      id="address"
                      type="text"
                      className={`input pl-10 ${errors.address ? 'border-destructive' : ''}`}
                      {...register('address', {
                        required: 'La dirección es requerida',
                      })}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="district" className="block text-sm font-medium">
                    Distrito *
                  </label>
                  <input
                    id="district"
                    type="text"
                    className={`input ${errors.district ? 'border-destructive' : ''}`}
                    {...register('district', {
                      required: 'El distrito es requerido',
                    })}
                  />
                  {errors.district && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.district.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="province" className="block text-sm font-medium">
                    Provincia *
                  </label>
                  <select
                    id="province"
                    className={`select ${errors.province ? 'border-destructive' : ''}`}
                    {...register('province', {
                      required: 'La provincia es requerida',
                    })}
                  >
                    <option value="">Seleccionar provincia</option>
                    <option value="Lima">Lima</option>
                    <option value="Arequipa">Arequipa</option>
                    <option value="Trujillo">Trujillo</option>
                    <option value="Chiclayo">Chiclayo</option>
                    <option value="Piura">Piura</option>
                    <option value="Cusco">Cusco</option>
                    <option value="Ica">Ica</option>
                    <option value="Huancayo">Huancayo</option>
                  </select>
                  {errors.province && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.province.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="reference" className="block text-sm font-medium">
                    Referencia
                  </label>
                  <input
                    id="reference"
                    type="text"
                    className={`input ${errors.reference ? 'border-destructive' : ''}`}
                    placeholder="Referencia de ubicación"
                    {...register('reference')}
                  />
                  {errors.reference && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.reference.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!isLima && (
              <div className="border-t border-gray-100 pt-6 animate-in fade-in duration-300">
                <h3 className="font-medium text-lg mb-4">Información de Transporte</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="transport" className="block text-sm font-medium">
                      Transporte *
                    </label>
                    <input
                      id="transport"
                      type="text"
                      className={`input ${errors.transport ? 'border-destructive' : ''}`}
                      {...register('transport', {
                        required: !isLima ? 'El transporte es requerido' : false,
                      })}
                    />
                    {errors.transport && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.transport.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="transportDistrict" className="block text-sm font-medium">
                      Distrito Transporte *
                    </label>
                    <input
                      id="transportDistrict"
                      type="text"
                      className={`input ${errors.transportDistrict ? 'border-destructive' : ''}`}
                      {...register('transportDistrict', {
                        required: !isLima ? 'El distrito de transporte es requerido' : false,
                      })}
                    />
                    {errors.transportDistrict && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.transportDistrict.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="transportAddress" className="block text-sm font-medium">
                      Dirección Transporte *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <MapPin size={18} />
                      </div>
                      <input
                        id="transportAddress"
                        type="text"
                        className={`input pl-10 ${errors.transportAddress ? 'border-destructive' : ''}`}
                        {...register('transportAddress', {
                          required: !isLima ? 'La dirección de transporte es requerida' : false,
                        })}
                      />
                    </div>
                    {errors.transportAddress && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.transportAddress.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/clients')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={<Save size={18} />}
                loading={isLoading}
              >
                {isEditMode ? 'Actualizar Cliente' : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}