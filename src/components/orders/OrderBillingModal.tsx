import React from 'react';
import { X, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { Order, PaymentDocumentStatus } from '../../lib/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';

interface OrderBillingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const paymentStatusColors = {
  [PaymentDocumentStatus.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [PaymentDocumentStatus.VENCIDA]: 'bg-red-100 text-red-800',
  [PaymentDocumentStatus.PAGADA_PARCIAL]: 'bg-blue-100 text-blue-800',
  [PaymentDocumentStatus.PAGADA]: 'bg-green-100 text-green-800',
};

const paymentStatusLabels = {
  [PaymentDocumentStatus.PENDIENTE]: 'Pendiente',
  [PaymentDocumentStatus.VENCIDA]: 'Vencida',
  [PaymentDocumentStatus.PAGADA_PARCIAL]: 'Pagada Parcial',
  [PaymentDocumentStatus.PAGADA]: 'Pagada',
};

export function OrderBillingModal({ order, isOpen, onClose }: OrderBillingModalProps) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Detalle del Pedido
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: {order.client?.commercialName} - RUC: {order.client?.ruc}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Productos
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio Unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product?.code || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.product?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Subtotal:
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(order.subtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      IGV (18%):
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                      {formatCurrency(order.igv)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-gray-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-base text-right font-bold text-primary">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary" />
              Forma de Pago
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">Tipo de Pago:</span>
                  <p className="text-base font-semibold text-gray-900 mt-1">
                    {order.paymentType === 'contado' ? 'Contado' : 'Crédito'}
                  </p>
                </div>
                {order.paymentType === 'credito' && order.creditType && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tipo de Crédito:</span>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {order.creditType === 'factura' ? 'Factura' : 'Letras'}
                    </p>
                  </div>
                )}
                {order.paymentType === 'credito' && order.installments && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Número de Cuotas:</span>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {order.installments}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {order.installmentDetails && order.installmentDetails.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                Detalle de Cuotas
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cuota
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Vencimiento
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Días
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Pagado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.installmentDetails.map((installment) => (
                      <tr key={installment.id}>
                        <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                          {installment.installmentNumber}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(installment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {formatDate(new Date(installment.dueDate))}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {installment.daysDue} días
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {installment.paidAmount > 0 ? formatCurrency(installment.paidAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={paymentStatusColors[installment.status]}>
                            {paymentStatusLabels[installment.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary">
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
