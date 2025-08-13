import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Package, User, Calendar, FileText, Clock, CheckCircle, Truck } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { OrderStatus, UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
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

const statusIcons = {
  borrador: <FileText className="h-4 w-4" />,
  tomado: <Clock className="h-4 w-4" />,
  confirmado: <CheckCircle className="h-4 w-4" />,
  en_preparacion: <Package className="h-4 w-4" />,
  despachado: <Truck className="h-4 w-4" />,
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
  const [statusLoading, setStatusLoading] = useState(false);

  const canEdit = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        try {
          const orderData = await getOrderById(id);
          if (orderData) {
            setOrder(orderData);
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

    loadOrder();
  }, [id, getOrderById, getOrderStatusLogs, navigate]);

  const handleStatusChange = async () => {
    if (!newStatus || !order) return;

    try {
      setStatusLoading(true);
      await updateOrderStatus(
        order.id, 
        newStatus as OrderStatus, 
        statusObservations,
        Boolean(statusObservations.trim())
      );
      
      // Reload order data
      const updatedOrder = await getOrderById(order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
        const logs = await getOrderStatusLogs(order.id);
        setStatusLogs(logs);
      }
      
      setShowStatusModal(false);
      setNewStatus('');
      setStatusObservations('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

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
        <Link to="/orders">
          <Button className="mt-4">Volver a Pedidos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground mt-1">
            Detalle completo del pedido
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
          {canEdit && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(true)}
              >
                Cambiar Estado
              </Button>
              <Link to={`/orders/edit/${order.id}`}>
                <Button icon={<Edit size={18} />}>
                  Editar Pedido
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="card-title">Estado del Pedido</h2>
                <Badge className={statusColors[order.status]}>
                  <div className="flex items-center gap-2">
                    {statusIcons[order.status]}
                    {statusLabels[order.status]}
                  </div>
                </Badge>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </h2>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre Comercial</label>
                  <p className="font-medium">{order.client?.commercialName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">RUC</label>
                  <p className="font-medium">{order.client?.ruc}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Razón Social</label>
                  <p className="font-medium">{order.client?.businessName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Dirección</label>
                  <p className="font-medium">
                    {order.client?.address}, {order.client?.district}, {order.client?.province}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos del Pedido
              </h2>
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
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-gray-500">Código: {item.product?.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium">{formatCurrency(item.subtotal)}</span>
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

          {/* Observations */}
          {order.observations && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Observaciones</h2>
              </div>
              <div className="card-content">
                <p className="text-gray-700">{order.observations}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información del Pedido
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Vendedor</label>
                <p className="font-medium">{order.salesperson?.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Creado por</label>
                <p className="font-medium">{order.createdByUser?.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última Actualización</label>
                <p className="font-medium">
                  {new Date(order.updatedAt).toLocaleDateString('es-PE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Historial de Estados</h2>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {statusLogs.map((log, index) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {statusIcons[log.status] || <Clock className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[log.status] || 'bg-gray-100 text-gray-800'}>
                          {statusLabels[log.status] || log.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Por {log.createdByUser?.fullName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {log.observations && (
                        <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                          {log.observations}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Cambiar Estado del Pedido"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nuevo Estado</label>
            <select
              className="select w-full"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="">Seleccionar estado</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value} disabled={value === order.status}>
                  {label} {value === order.status ? '(Actual)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Observaciones (Opcional)</label>
            <textarea
              className="input resize-none w-full"
              rows={3}
              placeholder="Agregar observaciones sobre el cambio de estado..."
              value={statusObservations}
              onChange={(e) => setStatusObservations(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowStatusModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              loading={statusLoading}
              disabled={!newStatus}
            >
              Cambiar Estado
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}