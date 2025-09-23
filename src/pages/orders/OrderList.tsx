import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Filter, AlertTriangle, Download, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useAuthStore } from '../../store/auth-store';
import { useUserStore } from '../../store/user-store';
import { OrderImageTemplate } from '../../components/orders/OrderImageTemplate';
import { useOrderImageDownload } from '../../hooks/useOrderImageDownload';
import { UserRole, OrderStatus } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';

const statusColors = {
  borrador: 'bg-gray-100 text-gray-800',
  tomado: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  en_preparacion: 'bg-purple-100 text-purple-800',
  despachado: 'bg-indigo-100 text-indigo-800',
};

const statusLabels = {
  borrador: 'Borrador',
  tomado: 'Tomado',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  despachado: 'Despachado',
};

export default function OrderList() {
  const { orders, totalOrders, isLoading, error, getOrders, deleteOrder, updateOrderStatus } = useOrderStore();
  const { user } = useAuthStore();
  const { getUsersByRole } = useUserStore();
  const { downloadOrderAsImage, shareOrderAsImage } = useOrderImageDownload();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [salespersonFilter, setSalespersonFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [salespeople, setSalespeople] = useState<{ id: string; fullName: string }[]>([]);
  
  const ORDERS_PER_PAGE = 10;
  
  // Calculate pagination values
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ORDERS_PER_PAGE, totalOrders);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Status update states
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Download states
  const [downloadingOrder, setDownloadingOrder] = useState<string | null>(null);
  const [sharingOrder, setSharingOrder] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Full order data for image generation
  const [fullOrderForImage, setFullOrderForImage] = useState<Order | null>(null);
  
  // Check if current user can see salesperson filter
  const canFilterBySalesperson = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  // Load orders when filters or page change
  useEffect(() => {
    getOrders(currentPage, ORDERS_PER_PAGE, searchTerm, statusFilter === 'all' ? '' : statusFilter, monthFilter, yearFilter, salespersonFilter === 'all' ? '' : salespersonFilter);
  }, [getOrders, currentPage, searchTerm, statusFilter, salespersonFilter, monthFilter, yearFilter]);

  // Set current month/year as default filters
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1);
    const currentYear = String(currentDate.getFullYear());
    setMonthFilter(currentMonth);
    setYearFilter(currentYear);
  }, []);
  
  // Load salespeople for filter (only for Admin/Super_Admin)
  useEffect(() => {
    const loadSalespeople = async () => {
      if (canFilterBySalesperson) {
        try {
          const salespeople = await getUsersByRole(UserRole.ASESOR_VENTAS);
          setSalespeople(salespeople);
        } catch (error) {
          console.error('Error loading salespeople for filter:', error);
        }
      }
    };
    
    loadSalespeople();
  }, [canFilterBySalesperson, getUsersByRole]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, salespersonFilter, monthFilter, yearFilter]);
  
  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteOrder(orderToDelete);
      // Reload current page after deletion
      await getOrders(currentPage, ORDERS_PER_PAGE, searchTerm, statusFilter === 'all' ? '' : statusFilter, monthFilter, yearFilter, salespersonFilter === 'all' ? '' : salespersonFilter);
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      // Error handled by store
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingStatus(orderId);
      await updateOrderStatus(orderId, newStatus);
      // Reload current page after status update
      await getOrders(currentPage, ORDERS_PER_PAGE, searchTerm, statusFilter === 'all' ? '' : statusFilter, monthFilter, yearFilter, salespersonFilter === 'all' ? '' : salespersonFilter);
    } catch (error) {
      // Error handled by store
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDownloadOrder = async (orderId: string) => {
    try {
      setDownloadingOrder(orderId);
      setDownloadError(null);
      
      // Load full order details
      const fullOrder = await getOrderById(orderId);
      if (!fullOrder) {
        throw new Error('No se pudo cargar el pedido completo');
      }
      
      // Set the full order for image generation
      setFullOrderForImage(fullOrder);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate and download image
      await downloadOrderAsImage(fullOrder);
      
      // Clear the full order data
      setFullOrderForImage(null);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Error al descargar el pedido');
    } finally {
      setDownloadingOrder(null);
    }
  };

  const handleShareOrder = async (orderId: string) => {
    try {
      setSharingOrder(orderId);
      setDownloadError(null);
      
      // Load full order details
      const fullOrder = await getOrderById(orderId);
      if (!fullOrder) {
        throw new Error('No se pudo cargar el pedido completo');
      }
      
      // Set the full order for image generation
      setFullOrderForImage(fullOrder);
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate and share image
      await shareOrderAsImage(fullOrder);
      
      // Clear the full order data
      setFullOrderForImage(null);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Error al compartir el pedido');
    } finally {
      setSharingOrder(null);
    }
  };

  // Orders are now pre-filtered and paginated from the server
  const displayOrders = orders;

  const canCreateOrder = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);
  const canManageOrders = user?.role && ['super_admin', 'admin', 'asesor_ventas'].includes(user.role);

  const isAsesorVentas = useMemo(() => user?.role === 'asesor_ventas', [user?.role]);

  // Helper function to determine if an order can be edited
  const canEditOrder = (order: any) => {
    if (!user?.role) return false;
    
    // Asesor de ventas can only edit borrador and tomado
    if (user.role === UserRole.ASESOR_VENTAS) {
      return ['borrador', 'tomado'].includes(order.status);
    }
    
    // Admin and super_admin can only edit borrador and tomado
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return ['borrador', 'tomado'].includes(order.status);
    }
    
    return false;
  };

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

      {downloadError && (
        <Alert variant="destructive" className="mb-6">
          {downloadError}
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-start">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar pedidos
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por Cliente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {canFilterBySalesperson && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendedor
              </label>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              >
                <option value="all">Todos los vendedores</option>
                {salespeople.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <div className="flex gap-2">
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="1">Enero</option>
                <option value="2">Febrero</option>
                <option value="3">Marzo</option>
                <option value="4">Abril</option>
                <option value="5">Mayo</option>
                <option value="6">Junio</option>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
              <input
                type="number"
                placeholder="Año"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-20"
                min="2020"
                max="2030"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        {/* Results Info */}
        {totalOrders > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Mostrando {startIndex} a {endIndex} de {totalOrders} pedidos
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="space-y-4 p-4">
              {displayOrders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 text-muted-foreground opacity-30">📋</div>
                  <h3 className="mt-4 text-lg font-medium">No se encontraron pedidos</h3>
                  <p className="mt-1 text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || salespersonFilter !== 'all' || monthFilter !== 'all' || yearFilter !== ''
                      ? 'No hay resultados para tu búsqueda'
                      : 'Comienza creando un nuevo pedido'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && salespersonFilter === 'all' && monthFilter === 'all' && yearFilter === '' && canCreateOrder && (
                    <Link to="/orders/new" className="mt-6 inline-block">
                      <Button icon={<Plus size={18} />}>Nuevo Pedido</Button>
                    </Link>
                  )}
                </div>
              ) : (
                displayOrders.map((order, index) => (
                  <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900">
                        Pedido #{startIndex + index}
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cliente:</span>
                        <div className="text-right">
                          <div className="font-medium">{order.client?.businessName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{order.client?.commercialName || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.client?.ruc || 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vendedor:</span>
                        <span>
                          {order.salesperson?.fullName || 'Sin vendedor asignado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Estado:</span>
                        {canManageOrders && user?.role && (user.role !== 'asesor_ventas' || ['borrador', 'tomado'].includes(order.status)) ? (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                            disabled={updatingStatus === order.id}
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {Object.entries(statusLabels)
                              .filter(([value, label]) => {
                                if (user.role === 'asesor_ventas') {
                                  return value === 'borrador' || value === 'tomado';
                                }
                                return true;
                              })
                              .map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                          </select>
                        ) : (
                          <Badge className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="font-medium">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha:</span>
                        <span>{formatDate(new Date(order.createdAt))}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                      {canEditOrder(order) ? (
                        <Link to={`/orders/edit/${order.id}`}>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                        </Link>
                      ) : (
                        <Link to={`/orders/detail/${order.id}`}>
                          <Button variant="ghost" size="sm" icon={<Eye size={16} />} />
                        </Link>
                      )}
                      {!isAsesorVentas && canManageOrders && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDeleteClick(order.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download size={16} />}
                            onClick={() => handleDownloadOrder(order.id)}
                            
                            loading={downloadingOrder === order.id}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Descargar como imagen"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Share size={16} />}
                            onClick={() => handleShareOrder(order.id)}
                            loading={sharingOrder === order.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Compartir"
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
            <thead className="bg-muted hidden sm:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 hidden sm:table-row-group">
              {displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || salespersonFilter !== 'all' || monthFilter !== 'all' || yearFilter !== ''
                      ? 'No se encontraron pedidos con los filtros aplicados'
                      : 'No hay pedidos registrados'
                    }
                  </td>
                </tr>
              ) : (
                displayOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {startIndex + index}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.client?.businessName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {order.client?.commercialName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.client?.ruc || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.salesperson?.fullName || 'Sin vendedor asignado'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManageOrders && user?.role && (user.role !== 'asesor_ventas' || ['borrador', 'tomado'].includes(order.status)) ? (
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          disabled={updatingStatus === order.id}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          {Object.entries(statusLabels)
                            .filter(([value, label]) => {
                              if (user.role === 'asesor_ventas') {
                                return value === 'borrador' || value === 'tomado';
                              }
                              return true;
                            })
                            .map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                      ) : (
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(new Date(order.createdAt))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {canEditOrder(order) ? (
                          <>
                            <Link to={`/orders/edit/${order.id}`}>
                              <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                            </Link>
                          </>
                        ) : (
                          <Link to={`/orders/detail/${order.id}`}>
                            <Button variant="ghost" size="sm" icon={<Eye size={16} />} />
                          </Link>
                        )}
                        {!isAsesorVentas && canManageOrders && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              onClick={() => handleDeleteClick(order.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            />
                          </>
                        )}
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download size={16} />}
                            onClick={() => handleDownloadOrder(order)}
                            loading={downloadingOrder === order.id}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hidden sm:inline-flex"
                            title="Descargar como imagen"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Share size={16} />}
                            onClick={() => handleShareOrder(order)}
                            loading={sharingOrder === order.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 hidden sm:inline-flex"
                            title="Compartir"
                          />
                        </>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalOrders > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                icon={<ChevronLeft size={16} />}
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "primary" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                icon={<ChevronRight size={16} />}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <h3 className="font-medium">¿Estás seguro?</h3>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente este pedido y no se puede deshacer.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              loading={deleteLoading}
            >
              Eliminar Pedido
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden Order Templates for Image Generation */}
      {fullOrderForImage && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
          <OrderImageTemplate order={fullOrderForImage} />
        </div>
      )}
    </div>
  );
}