import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Save, User, Users } from 'lucide-react';
import { useUserStore } from '../../store/user-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { OrderStatus, UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { formatCurrency } from '../../lib/utils';

export function OrderForm() {
  const navigate = useNavigate();
  const { getUsersByRole } = useUserStore();
  const { getClientsBySalesperson } = useClientStore();
  const { getProducts } = useProductStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salespeople, setSalespeople] = useState<Array<{ id: string; fullName: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; commercialName: string }>>([]);
  const [products, setProducts] = useState<Array<any>>([]);
  
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load salespeople
        const salespeople = await getUsersByRole(UserRole.SALESPERSON);
        setSalespeople(salespeople.map(s => ({ id: s.id, fullName: s.fullName })));
        
        // Load products
        const products = await getProducts();
        setProducts(products || []);
        
        setIsLoading(false);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Error al cargar datos iniciales');
        }
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [getUsersByRole, getProducts]);
  
  useEffect(() => {
    const loadClients = async () => {
      if (selectedSalesperson) {
        try {
          setIsLoading(true);
          const clients = await getClientsBySalesperson(selectedSalesperson);
          setClients(clients.map(c => ({ id: c.id, commercialName: c.commercialName })));
          setIsLoading(false);
        } catch (error) {
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('Error al cargar clientes');
          }
          setIsLoading(false);
        }
      } else {
        setClients([]);
      }
    };
    
    loadClients();
  }, [selectedSalesperson, getClientsBySalesperson]);
  
  const handleSalespersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSalesperson(e.target.value);
    setSelectedClient('');
  };
  
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClient(e.target.value);
  };
  
  if (isLoading) {
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
          <h1 className="text-3xl font-bold">Nuevo Pedido</h1>
          <p className="text-muted-foreground mt-1">
            Crea un nuevo pedido para un cliente
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/orders')}
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
          <h2 className="card-title text-xl">Información del Pedido</h2>
          <p className="card-description">
            Selecciona el vendedor y el cliente para el pedido
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="salesperson" className="block text-sm font-medium">
                  Vendedor *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <User size={18} />
                  </div>
                  <select
                    id="salesperson"
                    className="select pl-10"
                    value={selectedSalesperson}
                    onChange={handleSalespersonChange}
                  >
                    <option value="">Seleccionar vendedor</option>
                    {salespeople.map((salesperson) => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSalesperson === '' && (
                  <p className="text-muted-foreground text-sm mt-1">
                    Primero debes seleccionar un vendedor
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="client" className="block text-sm font-medium">
                  Cliente *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Users size={18} />
                  </div>
                  <select
                    id="client"
                    className="select pl-10"
                    value={selectedClient}
                    onChange={handleClientChange}
                    disabled={!selectedSalesperson}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.commercialName}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSalesperson && clients.length === 0 && (
                  <p className="text-muted-foreground text-sm mt-1">
                    Este vendedor no tiene clientes asignados
                  </p>
                )}
              </div>
            </div>
            
            {selectedClient && (
              <div className="border-t border-gray-100 pt-6 animate-in fade-in duration-300">
                <h3 className="font-medium text-lg mb-4">Productos Disponibles</h3>
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                  <h3 className="mt-4 text-lg font-medium">Sistema de Pedidos - Desarrollo Futuro</h3>
                  <p className="mt-1 text-muted-foreground max-w-md mx-auto">
                    Esta pantalla servirá como base para construir un sistema de pedidos más avanzado en desarrollos futuros.
                  </p>
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground mb-2">
                      Se han seleccionado:
                    </p>
                    <div className="flex justify-center gap-6">
                      <div>
                        <span className="text-xl font-bold text-primary">
                          {selectedSalesperson ? '1' : '0'}
                        </span>
                        <p className="text-xs text-muted-foreground">Vendedor</p>
                      </div>
                      <div>
                        <span className="text-xl font-bold text-primary">
                          {selectedClient ? '1' : '0'}
                        </span>
                        <p className="text-xs text-muted-foreground">Cliente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/orders')}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                icon={<Save size={18} />}
                disabled={!selectedClient}
              >
                Guardar Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}