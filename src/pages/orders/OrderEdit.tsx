import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { useAuthStore } from '../../store/auth-store';
import { OrderStatus, Client, Product, OrderItem } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';

interface OrderFormItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export function OrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getOrderById, updateOrder, addOrderItem, updateOrderItem, removeOrderItem, isLoading, error } = useOrderStore();
  const { clients, getClients } = useClientStore();
  const { products, categories, getProducts, getCategories } = useProductStore();
  
  const [order, setOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [orderItems, setOrderItems] = useState([]);
  const [observations, setObservations] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([getClients(), getProducts(), getCategories()]);
      
      if (id) {
        try {
          const orderData = await getOrderById(id);
          if (orderData) {
            setOrder(orderData);
            setSelectedClient(orderData.client);
            setClientSearch(orderData.client?.commercialName || '');
            setObservations(orderData.observations || '');
            
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
      }
    };

    loadData();
  }, [id, getOrderById, getClients, getProducts, getCategories, navigate]);

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

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setClientSearch(client.commercialName);
    setShowClientResults(false);
  };

  const handleProductSelect = (product) => {
    const newItem = {
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

  const updateOrderItemLocal = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      subtotal: field === 'quantity' 
        ? value * updatedItems[index].unitPrice
        : updatedItems[index].quantity * value
    };
    setOrderItems(updatedItems);
  };

  const removeOrderItemLocal = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotal = total / 1.18;
  const igv = subtotal * 0.18;

  const handleSave = async () => {
    if (!selectedClient || !user || !order) return;

    try {
      // Update order basic info
      await updateOrder(order.id, {
        clientId: selectedClient.id,
        observations,
      });

      // Handle order items changes
      const existingItems = order.items || [];
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
          await addOrderItem(order.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
      }
      
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
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
        <Button onClick={() => navigate('/orders')} className="mt-4">
          Volver a Pedidos
        </Button>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">
            Editar Pedido #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground mt-1">
            Actualiza la información del pedido
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate(`/orders/${order.id}`)}
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
        {/* Client Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Cliente</h2>
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
            
            {selectedClient && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Cliente Seleccionado</h3>
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Selection */}
        {selectedClient && (
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
              <h2 className="card-title">Productos del Pedido</h2>
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
                            type="number"
                            min="1"
                            className="input w-20"
                            value={item.quantity}
                            onChange={(e) => updateOrderItemLocal(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-32"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItemLocal(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {formatCurrency(item.subtotal)}
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
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(igv)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
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
            <Button
              variant="outline"
              onClick={() => navigate(`/orders/${order.id}`)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              icon={<Save size={18} />}
              onClick={handleSave}
              disabled={isLoading || orderItems.length === 0}
              loading={isLoading}
            >
              Guardar Cambios
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}