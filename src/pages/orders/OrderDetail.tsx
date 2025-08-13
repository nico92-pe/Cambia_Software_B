import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Eye, Calendar, User, Building, MapPin, Package, FileText, Clock } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { OrderStatus, UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { formatCurrency } from '../../lib/utils';

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

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getOrderById, updateOrderStatus, getOrderStatusLogs, isLoading, error } = useOrderStore();
  
  const [order, setOrder] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusObservations, setStatusObservations] = useState('');

  useEffect(() => {
    const loadOrderData = async () => {
      if (id) {
        try {
          const orderData = await getOrderById(id);
          if (orderData) {
            setOrder(orderData);
            
            // Load status logs
            const logs = await getOrderStatusLogs(id);
            setStatusLogs(logs);
          } else {
            navigate('/orders');
          }
        } catch (error) {
          console.error('Error loading order:', error);
        }
      }
    };

    loadOrderData();
  }, [id, getOrderById, getOrderStatusLogs, navigate]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    try {
      await updateOrderStatus(order.id, newStatus, statusObservations, Boolean(statusObservations));
      
      // Reload order data
      const updatedOrder = await getOrderById(order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
        
        // Reload status logs
        const logs = await getOrderStatusLogs(order.id);
        setStatusLogs(logs);
      }
      
      setShowStatusModal(false);
      setNewStatus('');
      setStatusObservations('');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const canEditOrder = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);
  const canUpdateStatus = user?.role && ['super_admin', 'admin'].includes(user.role);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">Pedido no encontrado</h3>
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">
            Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground mt-1">
            Detalles del pedido y seguimiento
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/orders')}
          >
            Volver
          </Button>
          {canEditOrder && (
            <Link to={`/orders/edit/${order.id}`}>
              <Button icon={<Edit size={18} />}>
                Editar
              </Button>
            </Link>
          )}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Información del Pedido</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                      <p className="font-medium">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Creado por</p>
                      <p className="font-medium">
                        {order.createdByUser?.fullName || 'Usuario no encontrado'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Vendedor</p>
                      <p className="font-medium">
                        {order.salesperson?.fullName || 'Vendedor no encontrado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              {order.observations && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Observaciones</p>
                      <p className="mt-1">{order.observations}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Información del Cliente</h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Razón Social</p>
                      <p className="font-medium">{order.client?.businessName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre Comercial</p>
                      <p className="font-medium">{order.client?.commercialName}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">RUC</p>
                      <p className="font-medium">{order.client?.ruc}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">
                        {order.client?.address}, {order.client?.district}, {order.client?.province}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Productos del Pedido</h2>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-muted-foreground mr-3" />
                            <div>
                              <div className="font-medium">{item.product?.name}</div>
                              <div className="text-sm text-gray-500">Código: {item.product?.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{formatCurrency(item.unitPrice)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{formatCurrency(item.subtotal)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(order.igv)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status History */}
        <div className="space-y-6">
          {canUpdateStatus && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Actualizar Estado</h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nuevo Estado
                    </label>
                    <select
                      className="select w-full"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="">Seleccionar estado</option>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value} disabled={value === order.status}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      className="input resize-none w-full"
                      rows={3}
                      placeholder="Observaciones del cambio de estado..."
                      value={statusObservations}
                      onChange={(e) => setStatusObservations(e.target.value)}
                    />
                  </div>
                  
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus}
                    loading={isLoading}
                    className="w-full"
                  >
                    Actualizar Estado
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Historial de Estados</h2>
            </div>
            <div className="card-content">
              {statusLogs.length > 0 ? (
                <div className="space-y-4">
                  {statusLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-primary pl-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={statusColors[log.status]}>
                          {statusLabels[log.status]}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(log.createdAt).toLocaleDateString('es-PE')}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Por: {log.createdByUser?.fullName}
                      </p>
                      {log.observations && (
                        <p className="text-sm">{log.observations}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No hay historial de estados disponible
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}