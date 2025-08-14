import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Save, FileText, AlertTriangle, ChevronDown } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { useAuthStore } from '../../store/auth-store';
import { OrderStatus, Client, Product, OrderItem, UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';

const statusLabels = {
  borrador: 'Borrador',
  tomado: 'Tomado',
  confirmado: 'Confirmado',
  en_preparacion: 'En Preparación',
  despachado: 'Despachado',
};

interface OrderFormItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function OrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { getOrderById, createOrder, updateOrder, addOrderItem, updateOrderItem, removeOrderItem, isLoading, error } = useOrderStore();
  const { clients, getClients } = useClientStore();
  const { products, categories, getProducts, getCategories } = useProductStore();
  
  const [order, setOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(OrderStatus.BORRADOR);
  
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [orderItems, setOrderItems] = useState<OrderFormItem[]>([]);
  const [observations, setObservations] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'draft' | 'delete' | 'confirm' | null>(null);
  
  const isEditMode = Boolean(id);
  const canManageOrders = user?.role && ['super_admin', 'admin'].includes(user.role);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([getClients(), getProducts(), getCategories()]);
      } catch (error) {
        console.error('Error loading base data:', error);
      }
    };

    loadData();
  }, [getClients, getProducts, getCategories]);

  useEffect(() => {
    const loadOrder = async () => {
      if (!id) {
        return;
      }
      
      try {
        const orderData = await getOrderById(id);
        
        if (orderData) {
          setOrder(orderData);
          setSelectedClient(orderData.client || null);
          setClientSearch(orderData.client?.commercialName || '');
          setObservations(orderData.observations || '');
          setCurrentStatus(orderData.status);
          
          // Convert order items to form items
          const formItems = orderData.items?.map(item => ({
            id: item.id,
            productId: item.productId,
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })) || [];
          
          setOrderItems(formItems);
        } else {
          navigate('/orders');
        }
      } catch (error) {
        console.error('Error loading order:', error);
      }
    };

    loadOrder();
  }, [id, getOrderById, navigate]);

  // Filter clients based on search
  const filteredClients = clients.filter(client => 
    client.ruc.includes(clientSearch) ||
    client.commercialName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.businessName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                         product.code.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categoryId === selectedCategory;
    const notInOrder = !orderItems.some(item => item.productId === product.id);
    
    return matchesSearch && matchesCategory && notInOrder;
  });

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.commercialName);
    setShowClientResults(false);
  };

  const handleProductSelect = (product: Product) => {
    const newItem: OrderFormItem = {
      productId: product.id,
      product,
      quantity: 1,
      unitPrice: product.retailPrice,
      subtotal: product.retailPrice,
    };
    
    setOrderItems([...orderItems, newItem]);
    setProductSearch('');
    setShowProductResults(false);
  };

  const updateOrderItemLocal = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const updatedItems = [...orderItems];
    const numericValue = isNaN(value) ? 0 : value;
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numericValue,
      subtotal: field === 'quantity' 
        ? numericValue * updatedItems[index].unitPrice
        : updatedItems[index].quantity * numericValue
    };
    setOrderItems(updatedItems);
  };

  const removeOrderItemLocal = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const igvAmount = subtotalAmount * 0.18;
  const totalAmount = subtotalAmount + igvAmount;

  const handleAction = (action: 'draft' | 'delete' | 'confirm') => {
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction || !selectedClient || !user) return;

    try {
      if (confirmAction === 'delete') {
        // Clear form
        setSelectedClient(null);
        setClientSearch('');
        setOrderItems([]);
        setObservations('');
      } else if (isEditMode && id) {
        // Update existing order
        await updateOrder(id, {
          clientId: selectedClient.id,
          observations,
          status: currentStatus,
        });

        // Handle order items changes
        const existingItems = order?.items || [];
        const currentItems = orderItems;

        // Remove items that are no longer in the order
        for (const existingItem of existingItems) {
          const stillExists = currentItems.find(item => item.id === existingItem.id);
          if (!stillExists) {
            await removeOrderItem(existingItem.id);
          }
        }

        // Update or add items
        for (const item of currentItems) {
          if (item.id) {
            // Update existing item
            await updateOrderItem(item.id, {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            });
          } else {
            // Add new item
            await addOrderItem(id, {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            });
          }
        }
      } else {
        // Create new order
        const orderData = {
          clientId: selectedClient.id,
          salespersonId: selectedClient.salespersonId || user.id, // Fallback to current user if no salesperson
          status: confirmAction === 'confirm' ? OrderStatus.TOMADO : OrderStatus.BORRADOR,
          observations,
          createdBy: user.id,
        };
        
        console.log('🔍 Creating order with data:', orderData);

        const newOrder = await createOrder(orderData);
        
        // Add order items
        for (const item of orderItems) {
          await addOrderItem(newOrder.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
      }
      
      navigate('/orders');
    } catch (error) {
      // Error handled by store
    } finally {
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const getActionText = () => {
    switch (confirmAction) {
      case 'draft': return 'guardar como borrador';
      case 'delete': return 'eliminar';
      case 'confirm': return 'confirmar';
      default: return '';
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  if (isEditMode && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Actualiza la información del pedido' : 'Crea un nuevo pedido para un cliente'}
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

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Client Selection - Only show in create mode */}
        {!isEditMode && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Seleccionar Cliente</h2>
              <p className="card-description">
                Busca por RUC, nombre comercial o razón social
              </p>
            </div>
            <div className="card-content">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Search size={18} />
                </div>
                <input
                  id="client-search"
                  name="clientSearch"
                  type="text"
                  className="input pl-10"
                  placeholder="Buscar cliente..."
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientResults(true);
                    if (!e.target.value) {
                      setSelectedClient(null);
                    }
                  }}
                  onFocus={() => setShowClientResults(true)}
                />
                
                {showClientResults && clientSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="font-medium">{client.commercialName}</div>
                          <div className="text-sm text-gray-500">{client.businessName}</div>
                          <div className="text-sm text-gray-500">RUC: {client.ruc}</div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500">No se encontraron clientes</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Client Selected - Show in both modes */}
        {selectedClient && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Cliente Seleccionado</h2>
            </div>
            <div className="card-content">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nombre Comercial:</span> {selectedClient.commercialName}
                  </div>
                  <div>
                    <span className="font-medium">RUC:</span> {selectedClient.ruc}
                  </div>
                  <div>
                    <span className="font-medium">Razón Social:</span> {selectedClient.businessName}
                  </div>
                  <div>
                    <span className="font-medium">Dirección:</span> {selectedClient.address}, {selectedClient.district}, {selectedClient.province}
                  </div>
                  {selectedClient.salesperson && (
                    <div>
                      <span className="font-medium">Vendedor:</span> {selectedClient.salesperson.fullName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Selection - Only in create mode */}
        {selectedClient && !isEditMode && (
          <div className="card animate-in fade-in duration-300">
            <div className="card-header">
              <h2 className="card-title">Agregar Productos</h2>
              <p className="card-description">
                Busca productos por categoría, nombre o código
              </p>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Search size={18} />
                  </div>
                  <input
                    id="product-search"
                    name="productSearch"
                    type="text"
                    className="input pl-10"
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductResults(true);
                    }}
                    onFocus={() => setShowProductResults(true)}
                  />
                </div>
                
                <select
                  id="category-filter"
                  name="categoryFilter"
                  className="select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {showProductResults && productSearch && (
                <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mb-4">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              Código: {product.code} | Categoría: {getCategoryName(product.categoryId)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(product.retailPrice)}</div>
                            <div className="text-sm text-gray-500">Stock: {product.stock || 0}</div>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500">No se encontraron productos</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        {orderItems.length > 0 && (
          <div className="card animate-in fade-in duration-300">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <h2 className="card-title">Productos del Pedido</h2>
                {isEditMode && canManageOrders && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Estado:</label>
                    <div className="relative">
                      <select
                        value={currentStatus}
                        onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium">{item.product?.name}</div>
                            <div className="text-sm text-gray-500">Código: {item.product?.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            id={`quantity-${index}`}
                            name={`quantity-${index}`}
                            type="number"
                            min="0"
                            className="input w-20"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                updateOrderItemLocal(index, 'quantity', 0);
                              } else {
                                const numericValue = parseInt(value);
                                updateOrderItemLocal(index, 'quantity', isNaN(numericValue) ? 0 : numericValue);
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            id={`unit-price-${index}`}
                            name={`unitPrice-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-32"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                updateOrderItemLocal(index, 'unitPrice', 0);
                              } else {
                                const numericValue = parseFloat(value);
                                updateOrderItemLocal(index, 'unitPrice', isNaN(numericValue) ? 0 : numericValue);
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeOrderItemLocal(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          />
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
                      <span className="font-medium">{formatCurrency(subtotalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(igvAmount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observations */}
        {selectedClient && (
          <div className="card animate-in fade-in duration-300">
            <div className="card-header">
              <h2 className="card-title">Observaciones</h2>
            </div>
            <div className="card-content">
              <textarea
                id="observations"
                name="observations"
                className="input resize-none"
                rows={4}
                placeholder="Observaciones del pedido..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedClient && (
          <div className="flex justify-end space-x-4 animate-in fade-in duration-300">
            {!isEditMode && (
              <Button
                variant="outline"
                icon={<Save size={18} />}
                onClick={() => handleAction('draft')}
                disabled={isLoading || orderItems.length === 0}
              >
                Guardar Borrador
              </Button>
            )}
            <Button
              icon={<FileText size={18} />}
              onClick={() => handleAction('confirm')}
              disabled={isLoading || orderItems.length === 0}
            >
              {isEditMode ? 'Actualizar Pedido' : 'Confirmar Pedido'}
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar Acción"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <h3 className="font-medium">¿Estás seguro?</h3>
              <p className="text-sm text-muted-foreground">
                Esta acción va a {getActionText()} este pedido.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmAction === 'delete' ? 'destructive' : 'primary'}
              onClick={executeAction}
              loading={isLoading}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}