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
      className="bg-white p-10 mx-auto"
      style={{
        fontFamily: 'Arial, sans-serif',
        width: '1200px',
        minHeight: '800px'
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-6xl font-bold text-blue-600 mb-4">Importaciones Cambia</h1>
            <p className="text-2xl text-gray-600">Especialistas en griferías y accesorios</p>
            <p className="text-2xl text-gray-600 font-medium">943 830 608</p>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Pedido</h2>
            <p className="text-2xl text-gray-600">Fecha: {formatDate(new Date(order.createdAt))}</p>
            <div className="inline-block px-6 py-3 rounded-full text-xl font-bold bg-blue-100 text-blue-800 mt-3">
              {order.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
          INFORMACIÓN DEL CLIENTE
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xl text-gray-600 font-medium">Razón Social:</p>
            <p className="text-2xl font-bold text-gray-800">{order.client?.businessName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xl text-gray-600 font-medium">RUC:</p>
            <p className="text-2xl font-bold text-gray-800">{order.client?.ruc || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xl text-gray-600 font-medium">Nombre Comercial:</p>
            <p className="text-2xl font-bold text-gray-800">{order.client?.commercialName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xl text-gray-600 font-medium">Contacto:</p>
            <p className="text-2xl font-bold text-gray-800">
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
            <p className="text-xl text-gray-600 font-medium">Dirección:</p>
            <p className="text-2xl font-bold text-gray-800">
              {order.client?.address}, {order.client?.district}, {order.client?.province}
            </p>
          </div>

        {order.client?.transport && (
          <div className="col-span-2 mt-5 pt-5 border-t border-gray-200">
            <h4 className="text-2xl font-bold text-gray-700 mb-3">Información de Transporte:</h4>
            <p className="text-xl text-gray-600 font-medium">Transporte:</p>
            <p className="text-2xl font-bold text-gray-800">{order.client.transport}</p>
            <p className="text-xl text-gray-600 font-medium mt-3">Dirección de Transporte:</p>
            <p className="text-2xl font-bold text-gray-800">
              {order.client.transportAddress}, {order.client.transportDistrict}
            </p>
          </div>
        )}

        </div>
      </div>

      {/* Salesperson Information */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
          VENDEDOR
        </h3>
        <p className="text-2xl font-bold text-gray-800">{order.salesperson?.fullName || 'Sin vendedor asignado'}</p>
      </div>

      {/* Products Table */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
          PRODUCTOS
        </h3>
        {order.items && order.items.length > 0 ? (
          <table className="w-full border-collapse border-2 border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-3 py-3 text-left text-2xl font-bold w-[12%]">Código</th>
                <th className="border border-gray-300 px-3 py-3 text-left text-2xl font-bold w-[35%]">Producto</th>
                <th className="border border-gray-300 px-3 py-3 text-center text-2xl font-bold w-[13%]">Cant.</th>
                <th className="border border-gray-300 px-3 py-3 text-right text-2xl font-bold w-[20%]">P. Unit.</th>
                <th className="border border-gray-300 px-3 py-3 text-right text-2xl font-bold w-[20%]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-3 py-3 text-2xl font-bold">{item.product?.code || 'N/A'}</td>
                  <td className="border border-gray-300 px-3 py-3 text-2xl font-bold">{item.product?.name || 'Producto no disponible'}</td>
                  <td className="border border-gray-300 px-3 py-3 text-center text-2xl font-bold">{item.quantity}</td>
                  <td className="border border-gray-300 px-3 py-3 text-right text-2xl font-bold">{formatCurrency(item.unitPrice)}</td>
                  <td className="border border-gray-300 px-3 py-3 text-right text-2xl font-bold">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="border border-gray-300 p-5 text-center text-xl text-gray-500">
            No hay productos en este pedido
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-96">
          <div className="border-2 border-gray-300 p-6 bg-gray-50">
            <div className="flex justify-between mb-4">
              <span className="text-2xl text-gray-600 font-medium">Subtotal:</span>
              <span className="text-2xl font-bold">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-2xl text-gray-600 font-medium">IGV (18%):</span>
              <span className="text-2xl font-bold">{formatCurrency(order.igv)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-400 pt-4">
              <span className="text-2xl font-bold text-gray-800">TOTAL:</span>
              <span className="text-3xl font-bold text-gray-800">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
          TÉRMINOS DE PAGO
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xl text-gray-600 font-medium">Tipo de Pago:</p>
            <p className="text-2xl font-bold text-gray-800 capitalize">{order.paymentType}</p>
          </div>
          {order.paymentType === 'credito' && (
            <>
              <div>
                <p className="text-xl text-gray-600 font-medium">Tipo de Crédito:</p>
                <p className="text-2xl font-bold text-gray-800 capitalize">{order.creditType}</p>
              </div>
              <div>
                <p className="text-xl text-gray-600 font-medium">Número de Cuotas:</p>
                <p className="text-2xl font-bold text-gray-800">{order.installments}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Installments Details - Only for credit orders */}

      {order.paymentType === 'credito' && order.installmentDetails && order.installmentDetails.length > 0 && (
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
            DETALLE DE CUOTAS
          </h3>
          <table className="w-full border-collapse border-2 border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-5 py-4 text-center text-xl font-bold">Cuota</th>
                <th className="border border-gray-300 px-5 py-4 text-center text-xl font-bold">Monto</th>
                <th className="border border-gray-300 px-5 py-4 text-center text-xl font-bold">Fecha</th>
                <th className="border border-gray-300 px-5 py-4 text-center text-xl font-bold">Días</th>
              </tr>
            </thead>
            <tbody>
              {order.installmentDetails.map((installment, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-5 py-4 text-center text-lg font-bold">
                    {installment.installmentNumber}
                  </td>
                  <td className="border border-gray-300 px-5 py-4 text-center text-lg font-bold">
                    {formatCurrency(installment.amount)}
                  </td>
                  <td className="border border-gray-300 px-5 py-4 text-center text-lg font-medium">
                    {formatDate(parseYYYYMMDDToLocalDate(installment.dueDate))}
                  </td>
                  <td className="border border-gray-300 px-5 py-4 text-center text-lg font-medium">
                    {installment.daysDue} días
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="border border-gray-300 px-5 py-4">
                  <div className="flex justify-end">
                    <div className="text-2xl font-bold text-gray-800">
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
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-5 border-b-2 border-gray-300 pb-3">
            OBSERVACIONES
          </h3>
          <p className="text-xl text-gray-700 bg-gray-50 p-5 rounded border-2 font-medium leading-relaxed">
            {order.observations}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-5 text-center text-base text-gray-500">
        <p className="font-medium">Importaciones Cambia - 20607867462</p>
        <p className="font-medium">Av. José Bernardo Alcedo 525, San Martín de Porres, Lima, Perú</p>
        <p className="font-medium">contacto@griferiascambia.com - 943 830 608</p>
        <p className="mt-3 font-medium">Documento generado el {formatDate(new Date())}</p>
      </div>
    </div>
  );
}