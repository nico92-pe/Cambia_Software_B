import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Filter, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { UserRole, OrderStatus } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';

const statusColors = {
  borrador: 'bg-gray-100 text-gray-800',
  tomado: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_preparacion: 'bg-purple-100 text-purple-800',
  despachado: 'bg-green-100 text-green-800',
};

const statusLabels = {
  borrador: 'Borrador',
  tomado: 'Tomado',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  despachado: 'Despachado',
};

export default function OrderList() {
  const { orders, isLoading, error, getOrders, deleteOrder } = useOrderStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [monthYearFilter, setMonthYearFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; client: string } | null>(null);

  useEffect(() => {
    getOrders();
  }, [getOrders]);

  const handleDeleteClick = (order: any) => {
    setOrderToDelete({
      id: order.id,
      client: order.client?.commercialName || 'Cliente desconocido'
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try { 
      setDeleteLoading(orderToDelete.id);
      setDeleteError(null);
      await deleteOrder(orderToDelete.id);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      if (error instanceof Error) {
        setDeleteError(error.message);
      } else {
        setDeleteError('Error al eliminar el pedido');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client?.commercialName?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search only by commercial name
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    const matchesMonthYear = (() => {
      if (monthYearFilter === 'all') return true;
      
      const orderDate = new Date(order.createdAt);
      const orderMonthYear = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      return orderMonthYear === monthYearFilter;
    })();
    
    return matchesSearch && matchesStatus && matchesMonthYear;
  });

  const canCreateOrder = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);
  const canEditDelete = user?.role === UserRole.SUPER_ADMIN;

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

      {deleteError && (
        <Alert type="error" message={deleteError} />
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border"> 
        <div className="flex flex-wrap gap-4 items-start"> {/* Changed to flex-wrap and items-start for better alignment */}
          <div className="flex-1 min-w-[200px]"> {/* Added min-w for better responsiveness */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar pedidos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente" // Updated placeholder
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div> {/* Month and Year filter */}
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
                
                // Generar opciones para los últimos 12 meses
                for (let i = 0; i < 12; i++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                  const year = date.getFullYear();
                  const month = date.getMonth() + 1;
                  const value = `${year}-${String(month).padStart(2, '0')}`;
                  const label = date.toLocaleDateString('es-PE', { 
                    year: 'numeric', 
                    month: 'long' 
                  });
                  options.push(<option key={value} value={value}>{label}</option>);
                }
                return options;
              })()}
            </select>
          </div>

          <div> {/* Status filter */}
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"> {/* Moved icon here */}
              <Filter className="w-4 h-4 text-gray-400" />
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
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
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-4 p-4">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500"> 
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron pedidos con los filtros aplicados'
                    : 'No hay pedidos registrados'
                  } 
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900">
                        #{filteredOrders.indexOf(order) + 1} {/* Display row number */}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.client?.commercialName || 'Cliente no encontrado'}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{order.client?.ruc || 'N/A'}</span>
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
                    {canEditDelete && (
                      <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                        <Link 
                          to={`/orders/edit/${order.id}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-gray-600 hover:text-gray-900"
                          title="Editar pedido"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(order)}
                          disabled={deleteLoading === order.id}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                          title="Eliminar pedido"
                        >
                          {deleteLoading === order.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Desktop Table View */}
          <table className="w-full hidden sm:table">
            <thead className="bg-gray-50 border-b hidden sm:table-header-group">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> {/* Changed header to # */}
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                {canEditDelete && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 hidden sm:table-row-group">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={canEditDelete ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No se encontraron pedidos con los filtros aplicados' 
                      : 'No hay pedidos registrados'
                    }
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900"> {/* Display row number */}
                        {filteredOrders.indexOf(order) + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.client?.commercialName || 'Cliente no encontrado'}
                      </div>
                      <div className="text-sm text-gray-500">
                        RUC: {order.client?.ruc || 'N/A'}
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
                        S/ {order.total.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </div>
                    </td>
                    {canEditDelete && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            to={`/orders/edit/${order.id}`}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-gray-600 hover:text-gray-900 hidden sm:inline-flex"
                            title="Editar pedido"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(order)}
                            disabled={deleteLoading === order.id}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 text-red-600 hover:text-red-900 hover:bg-red-50 hidden sm:inline-flex"
                            title="Eliminar pedido"
                          >
                            {deleteLoading === order.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <h3 className="font-medium">¿Estás seguro?</h3>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente el pedido.
              </p>
            </div>
          </div>
          
          {orderToDelete && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Pedido a eliminar:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div><span className="font-medium">ID:</span> {orderToDelete.id.slice(0, 8)}...</div>
                <div><span className="font-medium">Cliente:</span> {orderToDelete.client}</div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleteLoading === orderToDelete?.id}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={deleteLoading === orderToDelete?.id}
            >
              Eliminar Pedido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}