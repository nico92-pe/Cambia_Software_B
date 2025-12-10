import React, { useEffect, useState } from 'react';
import { FileText, Save, Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 20;

export default function BillingList() {
  const { orders, totalOrders, isLoading, error, getOrders, updateInvoiceNumber } = useOrderStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'with_invoice' | 'without_invoice'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});
  const [modifiedOrders, setModifiedOrders] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getOrders(1, 1000);
  }, [getOrders]);

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    orders.forEach(order => {
      initialValues[order.id] = order.invoiceNumber || '';
    });
    setInvoiceNumbers(initialValues);
    setModifiedOrders(new Set());
  }, [orders]);

  const handleInvoiceChange = (orderId: string, value: string) => {
    setInvoiceNumbers(prev => ({
      ...prev,
      [orderId]: value
    }));

    const order = orders.find(o => o.id === orderId);
    if (order && value !== order.invoiceNumber) {
      setModifiedOrders(prev => new Set(prev).add(orderId));
    } else {
      setModifiedOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleSaveAllInvoices = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      for (const orderId of modifiedOrders) {
        await updateInvoiceNumber(orderId, invoiceNumbers[orderId] || '');
      }
      setModifiedOrders(new Set());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm ||
      order.client?.commercialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.ruc?.includes(searchTerm) ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    const matchesInvoice =
      invoiceFilter === 'all' ||
      (invoiceFilter === 'with_invoice' && order.invoiceNumber) ||
      (invoiceFilter === 'without_invoice' && !order.invoiceNumber);

    return matchesSearch && matchesStatus && matchesInvoice;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, invoiceFilter]);

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <select
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value as 'all' | 'with_invoice' | 'without_invoice')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los pedidos</option>
                  <option value="without_invoice">Sin número de factura</option>
                  <option value="with_invoice">Con número de factura</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pedidos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} de {filteredOrders.length} pedidos
            </p>
          </div>
          <Button
            onClick={handleSaveAllInvoices}
            disabled={modifiedOrders.size === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <Loader size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios {modifiedOrders.size > 0 && `(${modifiedOrders.size})`}
              </>
            )}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  #
                </th>
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
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron pedidos</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-center text-sm text-gray-500 font-medium">
                      {startIndex + index + 1}
                    </td>
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
                        {order.createdAt ? formatDate(new Date(order.createdAt)) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={invoiceNumbers[order.id] || ''}
                        onChange={(e) => handleInvoiceChange(order.id, e.target.value)}
                        placeholder="Número de factura"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
