import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Plus, Search, ShoppingCart } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useUserStore } from '../../store/user-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { OrderStatus, UserRole } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

export function OrderList() {
  const { orders, getOrders, isLoading, error } = useOrderStore();
  const { clients, getClients } = useClientStore();
  const { getUsersByRole } = useUserStore();
  const [salespeople, setSalespeople] = useState<Array<{ id: string; fullName: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    getOrders();
    getClients();
    
    const loadSalespeople = async () => {
      try {
        const salespeople = await getUsersByRole('asesor_ventas' as UserRole);
        setSalespeople(salespeople.map(s => ({ id: s.id, fullName: s.fullName })));
      } catch (error) {
        console.error('Error loading salespeople:', error);
      }
    };
    
    loadSalespeople();
  }, [getOrders, getClients, getUsersByRole]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.commercialName : 'Cliente no encontrado';
  };

  const getSalespersonName = (salespersonId: string) => {
    const salesperson = salespeople.find(s => s.id === salespersonId);
    return salesperson ? salesperson.fullName : 'Vendedor no encontrado';
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DRAFT:
        return <Badge variant="default">Borrador</Badge>;
      case OrderStatus.PENDING:
        return <Badge variant="warning">Pendiente</Badge>;
      case OrderStatus.PROCESSING:
        return <Badge variant="primary">En proceso</Badge>;
      case OrderStatus.SHIPPED:
        return <Badge variant="secondary">Enviado</Badge>;
      case OrderStatus.DELIVERED:
        return <Badge variant="success">Entregado</Badge>;
      case OrderStatus.CANCELED:
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const filteredOrders = orders.filter(
    (order) => {
      const clientName = getClientName(order.clientId).toLowerCase();
      const salespersonName = getSalespersonName(order.salespersonId).toLowerCase();
      
      const matchesSearch = 
        clientName.includes(searchTerm.toLowerCase()) ||
        salespersonName.includes(searchTerm.toLowerCase()) ||
        order.id.includes(searchTerm);
      
      const matchesStatus = statusFilter === '' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los pedidos de tus clientes
          </p>
        </div>
        <Link to="/orders/new">
          <Button icon={<Plus size={18} />}>Nuevo Pedido</Button>
        </Link>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative col-span-2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Search size={18} />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Buscar por cliente o vendedor..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div>
              <select
                className="select"
                value={statusFilter}
                onChange={handleStatusFilter}
              >
                <option value="">Todos los estados</option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status === OrderStatus.DRAFT && 'Borrador'}
                    {status === OrderStatus.PENDING && 'Pendiente'}
                    {status === OrderStatus.PROCESSING && 'En proceso'}
                    {status === OrderStatus.SHIPPED && 'Enviado'}
                    {status === OrderStatus.DELIVERED && 'Entregado'}
                    {status === OrderStatus.CANCELED && 'Cancelado'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No se encontraron pedidos</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || statusFilter
                  ? 'No hay resultados para tu búsqueda'
                  : 'Comienza creando un nuevo pedido'}
              </p>
              {!searchTerm && !statusFilter && (
                <Link to="/orders/new" className="mt-6 inline-block">
                  <Button icon={<Plus size={18} />}>Nuevo Pedido</Button>
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">#{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{getClientName(order.clientId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{getSalespersonName(order.salespersonId)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{formatCurrency(order.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" icon={<FileText size={16} />}>
                          Ver detalles
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}