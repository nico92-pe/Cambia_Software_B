import React, { useEffect, useState } from 'react';
import { FileText, Save, X, Search, Filter, ChevronDown } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { Order, OrderStatus } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { formatCurrency, formatDate } from '../../lib/utils';

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

export default function BillingList() {
  const { orders, totalOrders, isLoading, error, getOrders, updateInvoiceNumber } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingInvoiceNumber, setEditingInvoiceNumber] = useState('');
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getOrders(1, 1000);
  }, [getOrders]);

  const handleEditInvoice = (order: Order) => {
    setEditingOrderId(order.id);
    setEditingInvoiceNumber(order.invoiceNumber || '');
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setEditingInvoiceNumber('');
    setSaveError(null);
  };

  const handleSaveInvoice = async (orderId: string) => {
    setSavingInvoiceId(orderId);
    setSaveError(null);

    try {
      await updateInvoiceNumber(orderId, editingInvoiceNumber);
      setEditingOrderId(null);
      setEditingInvoiceNumber('');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingInvoiceId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.client?.commercialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.ruc?.includes(searchTerm) ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600 mt-1">
            Gestión de números de factura para pedidos
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {saveError && (
        <Alert variant="error">
          {saveError}
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por cliente, RUC o factura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Pedido
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value={OrderStatus.BORRADOR}>Borrador</option>
                  <option value={OrderStatus.TOMADO}>Tomado</option>
                  <option value={OrderStatus.CONFIRMADO}>Confirmado</option>
                  <option value={OrderStatus.EN_PREPARACION}>En Preparación</option>
                  <option value={OrderStatus.DESPACHADO}>Despachado</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Pedidos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total de {filteredOrders.length} pedidos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron pedidos</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.client?.commercialName}
                      </div>
                      <div className="text-xs text-gray-500">
                        RUC: {order.client?.ruc}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.salesperson?.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingOrderId === order.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingInvoiceNumber}
                            onChange={(e) => setEditingInvoiceNumber(e.target.value)}
                            placeholder="Número de factura"
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                            disabled={savingInvoiceId === order.id}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveInvoice(order.id)}
                            disabled={savingInvoiceId === order.id}
                          >
                            {savingInvoiceId === order.id ? (
                              <Loader size="sm" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCancelEdit}
                            disabled={savingInvoiceId === order.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleEditInvoice(order)}
                          className="cursor-pointer px-3 py-1.5 text-sm border border-transparent hover:border-gray-300 rounded transition-colors"
                        >
                          {order.invoiceNumber ? (
                            <span className="text-gray-900 font-medium">
                              {order.invoiceNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              Click para agregar
                            </span>
                          )}
                        </div>
                      )}
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
