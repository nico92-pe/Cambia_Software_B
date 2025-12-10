import React, { useEffect, useState } from 'react';
import { Search, Filter, FileText, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { usePaymentStore } from '../../store/payment-store';
import { useClientStore } from '../../store/client-store';
import { useUserStore } from '../../store/user-store';
import { PaymentDocumentStatus, UserRole } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuthStore } from '../../store/auth-store';

export function PaymentDocumentList() {
  const { user } = useAuthStore();
  const { paymentDocuments, stats, isLoading, getPaymentDocuments, updatePaymentStatus, getPaymentStats } = usePaymentStore();
  const { clients, getClients } = useClientStore();
  const { users, getUsers } = useUserStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentDocumentStatus | ''>('');
  const [clientFilter, setClientFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  const isAsesorVentas = user?.role === UserRole.ASESOR_VENTAS;

  useEffect(() => {
    getClients();
    if (!isAsesorVentas) {
      getUsers();
    }
    getPaymentStats();
  }, [getClients, getUsers, getPaymentStats, isAsesorVentas]);

  useEffect(() => {
    const filters: any = {};

    if (statusFilter) filters.status = statusFilter;
    if (clientFilter) filters.clientId = clientFilter;
    if (salespersonFilter) filters.salespersonId = salespersonFilter;
    if (dueDateFrom) filters.dueDateFrom = dueDateFrom;
    if (dueDateTo) filters.dueDateTo = dueDateTo;

    getPaymentDocuments(filters);
  }, [statusFilter, clientFilter, salespersonFilter, dueDateFrom, dueDateTo, getPaymentDocuments]);

  const filteredDocuments = paymentDocuments.filter(doc => {
    if (!searchTerm) return true;

    const search = searchTerm.toLowerCase();
    return (
      doc.client?.businessName.toLowerCase().includes(search) ||
      doc.client?.commercialName.toLowerCase().includes(search) ||
      doc.client?.ruc.includes(search) ||
      doc.order?.id.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: PaymentDocumentStatus) => {
    switch (status) {
      case PaymentDocumentStatus.PENDIENTE:
        return <Badge variant="warning">Pendiente</Badge>;
      case PaymentDocumentStatus.VENCIDA:
        return <Badge variant="danger">Vencida</Badge>;
      case PaymentDocumentStatus.PAGADA_PARCIAL:
        return <Badge variant="info">Pago Parcial</Badge>;
      case PaymentDocumentStatus.PAGADA:
        return <Badge variant="success">Pagada</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRegisterPayment = async () => {
    if (!selectedDocument || !paymentAmount || !paymentDate) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      await updatePaymentStatus(
        selectedDocument.id,
        parseFloat(paymentAmount),
        paymentDate,
        paymentNotes
      );

      setShowPaymentModal(false);
      setSelectedDocument(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNotes('');
    } catch (error) {
      console.error('Error registering payment:', error);
    }
  };

  const openPaymentModal = (doc: any) => {
    setSelectedDocument(doc);
    setPaymentAmount((doc.amount - doc.paidAmount).toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  if (isLoading && paymentDocuments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Letras y Cobros</h1>
        <p className="text-muted-foreground mt-1">
          Gestión de cuentas por cobrar y documentos de pago
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.totalPending || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.countPending || 0} documentos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.totalOverdue || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.countOverdue || 0} documentos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pago Parcial</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.totalPartiallyPaid || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.countPartiallyPaid || 0} documentos</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagados</p>
              <p className="text-xl font-bold">{formatCurrency(stats?.totalPaid || 0)}</p>
              <p className="text-xs text-gray-500">{stats?.countPaid || 0} documentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, RUC o número de pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentDocumentStatus | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value={PaymentDocumentStatus.PENDIENTE}>Pendiente</option>
                <option value={PaymentDocumentStatus.VENCIDA}>Vencida</option>
                <option value={PaymentDocumentStatus.PAGADA_PARCIAL}>Pago Parcial</option>
                <option value={PaymentDocumentStatus.PAGADA}>Pagada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Todos</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.commercialName}
                  </option>
                ))}
              </select>
            </div>

            {!isAsesorVentas && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendedor
                </label>
                <select
                  value={salespersonFilter}
                  onChange={(e) => setSalespersonFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Vencimiento Desde
              </label>
              <input
                type="date"
                value={dueDateFrom}
                onChange={(e) => setDueDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Vencimiento Hasta
              </label>
              <input
                type="date"
                value={dueDateTo}
                onChange={(e) => setDueDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border animate-in fade-in duration-500">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Lista de Cuotas por Cobrar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total de {filteredDocuments.length} cuotas
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Crédito
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Cuota
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Cuota
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pagado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Por Cobrar
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron cuotas</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const daysUntilDue = getDaysUntilDue(doc.dueDate);
                  const remaining = doc.amount - doc.paidAmount;

                  return (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Pedido #{doc.order?.id.substring(0, 8).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(doc.order?.createdAt || '').toLocaleDateString('es-PE')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {doc.client?.commercialName}
                        </div>
                        <div className="text-xs text-gray-500">
                          RUC: {doc.client?.ruc}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">
                          {doc.order?.creditType || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                          {doc.installmentNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          de {doc.order?.installments || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(doc.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-green-600 font-medium">
                          {formatCurrency(doc.paidAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(doc.dueDate).toLocaleDateString('es-PE')}
                        </div>
                        {doc.status !== PaymentDocumentStatus.PAGADA && (
                          <div className={`text-xs font-medium ${daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {daysUntilDue < 0
                              ? `Vencido hace ${Math.abs(daysUntilDue)} días`
                              : `Vence en ${daysUntilDue} días`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(doc.status)}
                        {doc.paymentDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Pagado: {new Date(doc.paymentDate).toLocaleDateString('es-PE')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {doc.status !== PaymentDocumentStatus.PAGADA && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentModal(doc)}
                          >
                            Registrar Pago
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar Pago"
      >
        {selectedDocument && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{selectedDocument.client?.commercialName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pedido</p>
                  <p className="font-medium">{selectedDocument.order?.id.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cuota</p>
                  <p className="font-medium">{selectedDocument.installmentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimiento</p>
                  <p className="font-medium">
                    {new Date(selectedDocument.dueDate).toLocaleDateString('es-PE')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monto Total</p>
                  <p className="font-medium">{formatCurrency(selectedDocument.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Pendiente</p>
                  <p className="font-medium text-red-600">
                    {formatCurrency(selectedDocument.amount - selectedDocument.paidAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a Pagar *
              </label>
              <input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Pago *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas / Observaciones
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Ingrese observaciones adicionales..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRegisterPayment}
                disabled={!paymentAmount || !paymentDate}
              >
                Registrar Pago
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
