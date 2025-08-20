import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, FileText, MapPin, Package, Phone, User } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { Order, OrderStatus } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';

const statusLabels = {
  borrador: 'Borrador',
  tomado: 'Tomado',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  despachado: 'Despachado',
};

const statusColors = {
  borrador: 'bg-gray-100 text-gray-800',
  tomado: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_preparacion: 'bg-purple-100 text-purple-800',
  despachado: 'bg-green-100 text-green-800',
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, isLoading, error } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (id) {
        try {
          const orderData = await getOrderById(id);
          if (orderData) {
            setOrder(orderData);
          } else {
            navigate('/orders');
          }
        } catch (error) {
          console.error('Error loading order:', error);
        }
      }
    };

    loadOrder();
  }, [id, getOrderById, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/orders')}
        >
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          Pedido no encontrado
        </Alert>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/orders')}
        >
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Detalle del Pedido</h1>
          <p className="text-muted-foreground mt-1">
            Información completa del pedido
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

      <div className="space-y-6">
        {/* Order Status and Basic Info */}
        <div className="card animate-in fade-in duration-500">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-xl">Información General</h2>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                    <p className="font-medium">{formatDate(new Date(order.createdAt))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Creado por</p>
                    <p className="font-medium">{order.createdByUser?.fullName || 'No disponible'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor Asignado</p>
                    <p className="font-medium">{order.salesperson?.fullName || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Pago</p>
                    <p className="font-medium capitalize">{order.paymentType}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Información del Cliente</h2>
          </div>
          <div className="card-content">
            {order.client ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Razón Social</p>
                    <p className="font-medium">{order.client.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Comercial</p>
                    <p className="font-medium">{order.client.commercialName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RUC</p>
                    <p className="font-medium">{order.client.ruc}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">
                        {order.client.address}, {order.client.district}, {order.client.province}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto</p>
                      <p className="font-medium">{order.client.contactName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{order.client.contactPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Información del cliente no disponible</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Productos del Pedido</h2>
          </div>
          <div className="card-content">
            {order.items && order.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-muted-foreground mr-3" />
                            <div>
                              <div className="font-medium">{item.product?.name || 'Producto no disponible'}</div>
                              <div className="text-sm text-muted-foreground">
                                Código: {item.product?.code || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(order.igv)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No hay productos en este pedido</p>
            )}
          </div>
        </div>

        {/* Payment Details for Credit Orders */}
        {order.paymentType === 'credito' && order.installmentDetails && order.installmentDetails.length > 0 && (
          <div className="card animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
              <h2 className="card-title text-xl">Detalle de Cuotas</h2>
              <p className="card-description">
                Tipo de crédito: {order.creditType} - {order.installments} cuotas
              </p>
            </div>
            <div className="card-content">
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                <div className="space-y-4">
                  {order.installmentDetails.map((installment) => (
                    <div key={installment.id} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-900">Cuota {installment.installmentNumber}</h3>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(installment.amount)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fecha de Vencimiento:</span>
                          <span className="font-medium">{formatDate(new Date(installment.dueDate))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Días:</span>
                          <span className="font-medium">{installment.daysDue} días</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Cuota
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Fecha de Vencimiento
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Días
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.installmentDetails.map((installment) => (
                        <tr key={installment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                            {installment.installmentNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                            {formatCurrency(installment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {formatDate(new Date(installment.dueDate))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {installment.daysDue} días
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observations */}
        {order.observations && (
          <div className="card animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
            <div className="card-header">
              <h2 className="card-title text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observaciones
              </h2>
            </div>
            <div className="card-content">
              <p className="text-gray-700 whitespace-pre-wrap">{order.observations}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}