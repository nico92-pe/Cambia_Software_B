import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { UserRole, OrderStatus } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';

const statusColors = {
  borrador: 'bg-gray-100 text-gray-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_preparacion: 'bg-purple-100 text-purple-800',
  listo: 'bg-green-100 text-green-800',
  despachado: 'bg-indigo-100 text-indigo-800',
  entregado: 'bg-emerald-100 text-emerald-800',
  cancelado: 'bg-red-100 text-red-800',
};

const statusLabels = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  listo: 'Listo',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function OrderList() {
  const { orders, isLoading, error, getOrders } = useOrderStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [monthYearFilter, setMonthYearFilter] = useState('all');

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client?.commercialName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canCreateOrder = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gestiona los pedidos del sistema</p>
        </div>
        {canCreateOrder && (
          <Link to="/orders/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pedido
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert type="error" message={error} />
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar pedidos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por Cliente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes y Año
            </label>
            <select
              value={monthYearFilter}
              onChange={(e) => setMonthYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[140px]"
            >
              <option value="all">Todos los meses</option>
              {(() => {
                const options = [];
                const currentDate = new Date();
                
                for (let i = 0; i < 12; i++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                  const year = date.getFullYear();
                  const month = date.getMonth() + 1;
                  const value = `${year}-${String(month).padStart(2, '0')}`;
                  const label = date.toLocaleDateString('es-PE', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  
                  options.push(
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                }
                
                return options;
              })()}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-4 p-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 text-muted-foreground opacity-30">📋</div>
                  <h3 className="mt-4 text-lg font-medium">No se encontraron pedidos</h3>
                  <p className="mt-1 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || monthYearFilter !== 'all'
                      ? 'No hay resultados para tu búsqueda'
                      : 'Comienza creando un nuevo pedido'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && monthYearFilter === 'all' && canCreateOrder && (
                    <Link to="/orders/new" className="mt-6 inline-block">
                      <Button icon={<Plus size={18} />}>Nuevo Pedido</Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredOrders.map((order, index) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900">
                        Pedido #{index + 1}
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cliente:</span>
                        <div className="text-right">
                          <div className="font-medium">{order.client?.businessName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{order.client?.commercialName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.client?.ruc || 'N/A'}
                          <span className="font-medium">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vendedor:</span>
                        <span>{order.salesperson?.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estado:</span>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">S/ {order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha:</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('es-PE')}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" icon={<Eye size={16} />} />
                      </Link>
                      {canCreateOrder && (
                        <Link to={`/orders/${order.id}/edit`}>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
            <thead className="bg-muted hidden sm:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 hidden sm:table-row-group">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || monthYearFilter !== 'all'
                      ? 'No se encontraron pedidos con los filtros aplicados'
                      : 'No hay pedidos registrados'
                    }
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.client?.businessName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.client?.commercialName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.client?.ruc || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.salesperson?.fullName || 'Vendedor no encontrado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/orders/${order.id}`}>
                          <Button variant="ghost" size="sm" icon={<Eye size={16} />} className="hidden sm:inline-flex">
                          </Button>
                        </Link>
                        {canCreateOrder && (
                          <Link to={`/orders/${order.id}/edit`}>
                            <Button variant="ghost" size="sm" icon={<Edit size={16} />} className="hidden sm:inline-flex">
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}