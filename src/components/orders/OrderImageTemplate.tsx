import React from 'react';
import { Order } from '../../lib/types';
import { formatCurrency, formatDate, parseYYYYMMDDToLocalDate } from '../../lib/utils';

interface OrderImageTemplateProps {
  order: Order;
}

export function OrderImageTemplate({ order }: OrderImageTemplateProps) {
  return (
    <div 
      id={`order-template-${order.id}`}
      className="bg-white p-8 max-w-2xl mx-auto"
      style={{ 
        fontFamily: 'Arial, sans-serif',
        width: '800px',
        minHeight: '600px'
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Importaciones Cambia</h1>
            <p className="text-gray-600">Especialistas en griferías y accesorios</p>
            <p className="text-gray-600">943 830 608</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido</h2>
            <p className="text-gray-600">Fecha: {formatDate(new Date(order.createdAt))}</p>
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
              {order.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          INFORMACIÓN DEL CLIENTE
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Razón Social:</p>
            <p className="font-medium text-gray-800">{order.client?.businessName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">RUC:</p>
            <p className="font-medium text-gray-800">{order.client?.ruc || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nombre Comercial:</p>
            <p className="font-medium text-gray-800">{order.client?.commercialName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contacto:</p>
            <p className="font-medium text-gray-800">
              {(() => {
                const parts = [];
                if (order.client?.contactName) {
                  parts.push(order.client.contactName);
                }
                if (order.client?.contactPhone) {
                  parts.push(order.client.contactPhone);
                }
                return parts.length > 0 ? parts.join(' - ') : 'N/A';
              })()}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-600">Dirección:</p>
            <p className="font-medium text-gray-800">
              {order.client?.address}, {order.client?.district}, {order.client?.province}
            </p>
          </div>

        {order.client?.transport && (
          <div className="col-span-2 mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Información de Transporte:      </h4>
            <p className="text-sm text-gray-600">Transporte:</p>
            <p className="font-medium text-gray-800">{order.client.transport}</p>
            <p className="text-sm text-gray-600 mt-2">Dirección de Transporte:</p>
            <p className="font-medium text-gray-800">
              {order.client.transportAddress}, {order.client.transportDistrict}
            </p>
          </div>
        )}
          
        </div>
      </div>

      {/* Salesperson Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          VENDEDOR
        </h3>
        <p className="font-medium text-gray-800">{order.salesperson?.fullName || 'Sin vendedor asignado'}</p>
      </div>

      {/* Products Table */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          PRODUCTOS
        </h3>
        {order.items && order.items.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Código</th>
                <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Producto</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Cant.</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">P. Unit.</th>
                <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.product?.code || 'N/A'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">{item.product?.name || 'Producto no disponible'}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-sm font-medium">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-gray-300 p-4 text-center text-gray-500">
            No hay productos en este pedido
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="border border-gray-300 p-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">IGV (18%):</span>
              <span className="text-sm font-medium">{formatCurrency(order.igv)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-400 pt-2">
              <span className="font-bold text-gray-800">TOTAL:</span>
              <span className="font-bold text-lg text-gray-800">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
          TÉRMINOS DE PAGO
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Tipo de Pago:</p>
            <p className="font-medium text-gray-800 capitalize">{order.paymentType}</p>
          </div>
          {order.paymentType === 'credito' && (
            <>
              <div>
                <p className="text-sm text-gray-600">Tipo de Crédito:</p>
                <p className="font-medium text-gray-800 capitalize">{order.creditType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Número de Cuotas:</p>
                <p className="font-medium text-gray-800">{order.installments}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Installments Details - Only for credit orders */}
      
      {order.paymentType === 'credito' && order.installmentDetails && order.installmentDetails.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
            DETALLE DE CUOTAS
          </h3>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Cuota</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Monto</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Fecha</th>
                <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">Días</th>
              </tr>
            </thead>
            <tbody>
              {order.installmentDetails.map((installment, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    {installment.installmentNumber}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                    {formatCurrency(installment.amount)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                    {formatDate(parseYYYYMMDDToLocalDate(installment.dueDate))}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                    {installment.daysDue} días
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-2">
                  <div className="flex justify-end">
                    <div className="font-bold text-gray-800">
                      Total Cuotas: {formatCurrency(order.installmentDetails.reduce((sum, inst) => sum + inst.amount, 0))}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Observations */}
      {order.observations && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1">
            OBSERVACIONES
          </h3>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
            {order.observations}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
        <p>Importaciones Cambia - 20607867462</p>
        <p>Av. José Bernardo Alcedo 525, San Martín de Porres, Lima, Perú</p>
        <p>contacto@griferiascambia.com - 943 830 608</p>
        <p className="mt-2">Documento generado el {formatDate(new Date())}</p>
      </div>
    </div>
  );
}