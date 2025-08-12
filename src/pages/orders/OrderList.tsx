import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Plus, Search, ShoppingCart, Eye } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { OrderStatus } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

export function OrderList() {
  const { orders, getOrders, deleteOrder, isLoading, error } = useOrderStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este pedido?')) {
      try {
        setDeleteLoading(id);
        await deleteOrder(id);
      } catch (error) {
        // Error handled by store
      } finally {
        setDeleteLoading(null);
      }
    }
  };
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.BORRADOR:
        return <Badge variant="default">Borrador</Badge>;
      case OrderStatus.TOMADO:
        return <Badge variant="warning">Tomado</Badge>;
      case OrderStatus.CONFIRMADO:
        return <Badge variant="primary">Confirmado</Badge>;
      case OrderStatus.EN_PREPARACION:
        return <Badge variant="secondary">En Preparación</Badge>;
      case OrderStatus.DESPACHADO:
        return <Badge variant="success">Despachado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const filteredOrders = orders.filter(
    (order) => {
      const clientName = order.client?.commercialName?.toLowerCase() || '';
      const salespersonName = order.salesperson?.fullName?.toLowerCase() || '';
      
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
                <option value={OrderStatus.BORRADOR}>Borrador</option>
                <option value={OrderStatus.TOMADO}>Tomado</option>
                <option value={OrderStatus.CONFIRMADO}>Confirmado</option>
                <option value={OrderStatus.EN_PREPARACION}>En Preparación</option>
                <option value={OrderStatus.DESPACHADO}>Despachado</option>
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
                    Pedido
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
                      <div className="font-medium">#{order.id?.slice(0, 8) || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{order.client?.commercialName || 'Cliente no encontrado'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{order.salesperson || 'Vendedor no encontrado'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-PE') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{formatCurrency(order.total || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/orders/view/${order.id}`}>
                          <Button variant="outline" size="sm" icon={<Eye size={16} />}>
                            Ver
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<FileText size={16} />}
                          onClick={() => order.id && handleDelete(order.id)}
                          loading={deleteLoading === order.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Eliminar
                        </Button>
                      </div>
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