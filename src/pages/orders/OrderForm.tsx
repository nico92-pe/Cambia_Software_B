import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Save, FileText, AlertTriangle, ChevronDown } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { useUserStore } from '../../store/user-store';
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

interface OrderInstallmentForm {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  daysDue: number;
}

// Helper function to format date for input (YYYY-MM-DD)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to calculate days between dates
const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Helper function to add days to a date
const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export function OrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { getOrderById, createOrder, updateOrder, addOrderItem, updateOrderItem, removeOrderItem, isLoading, error } = useOrderStore();
  const { clients, getClients } = useClientStore();
  const { products, categories, getProducts, getCategories } = useProductStore();
  const { getUsersByRole } = useUserStore();
  
  const [order, setOrder] = useState(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(OrderStatus.BORRADOR);
  const [items, setItems] = useState<OrderFormItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductResults, setShowProductResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [creditType, setCreditType] = useState<'factura' | 'letras'>('factura');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState<OrderInstallmentForm[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [salespeople, setSalespeople] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = !!id;
  const canEdit = user?.role !== UserRole.ASESOR_VENTAS || !isEditing;
  const canChangeStatus = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isCurrentUserSalesperson = user?.role === UserRole.ASESOR_VENTAS;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        getClients(),
        getProducts(),
        getCategories(),
      ]);

      // Load salespeople
      try {
        const salespeople = await getUsersByRole(UserRole.ASESOR_VENTAS);
        setSalespeople(salespeople);
      } catch (error) {
        console.error('Error loading salespeople:', error);
      }

      // Load order if editing
      if (id) {
        try {
          const orderData = await getOrderById(id);
          if (orderData) {
            setOrder(orderData);
            setSelectedClient(orderData.client || null);
            setCurrentStatus(orderData.status);
            setNotes(orderData.observations || '');
            setSelectedSalesperson(orderData.salespersonId);
            setPaymentType(orderData.paymentType || 'contado');
            setCreditType(orderData.creditType || 'factura');
            setInstallmentCount(orderData.installments || 1);
            
            // Convert order items to form items
            const formItems: OrderFormItem[] = orderData.items.map(item => ({
              id: item.id,
              productId: item.productId,
              product: item.product,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            }));
            setItems(formItems);

            // Load installments if credit order
            if (orderData.paymentType === 'credito' && orderData.installmentDetails) {
              const formInstallments: OrderInstallmentForm[] = orderData.installmentDetails.map(inst => ({
                installmentNumber: inst.installmentNumber,
                amount: inst.amount,
                dueDate: formatDateForInput(new Date(inst.dueDate)),
                daysDue: inst.daysDue,
              }));
              setInstallments(formInstallments);
            }
          }
        } catch (error) {
          setFormError('Error al cargar el pedido');
        }
      } else if (isCurrentUserSalesperson && user) {
        // Pre-select current user as salesperson for new orders
        setSelectedSalesperson(user.id);
      }
    };

    loadData();
  }, [id, getOrderById, getClients, getProducts, getCategories, getUsersByRole, isCurrentUserSalesperson, user]);

  // Generate installments when payment type changes to credit
  useEffect(() => {
    if (paymentType === 'credito' && total > 0) {
      generateInstallments();
    } else {
      setInstallments([]);
    }
  }, [paymentType, installmentCount, total]);

  const generateInstallments = () => {
    const baseAmount = Math.floor((total * 100) / installmentCount) / 100;
    const remainder = Math.round((total - (baseAmount * installmentCount)) * 100) / 100;
    const orderDate = new Date();
    
    const newInstallments: OrderInstallmentForm[] = [];
    
    for (let i = 1; i <= installmentCount; i++) {
      const amount = i === installmentCount ? baseAmount + remainder : baseAmount;
      const daysDue = i * 30;
      const dueDate = addDaysToDate(orderDate, daysDue);
      
      newInstallments.push({
        installmentNumber: i,
        amount,
        dueDate: formatDateForInput(dueDate),
        daysDue,
      });
    }
    
    setInstallments(newInstallments);
  };

  const handleClientSearch = (value: string) => {
    setClientSearch(value);
    setShowClientResults(value.length > 0);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch(client.commercialName);
    setShowClientResults(false);
    
    // Auto-select the client's salesperson if available
    if (client.salespersonId && !isCurrentUserSalesperson) {
      setSelectedSalesperson(client.salespersonId);
    }
  };

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    setShowProductResults(value.length > 0);
  };

  const addProduct = (product: Product) => {
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: OrderFormItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.wholesalePrice,
        subtotal: product.wholesalePrice,
      };
      setItems([...items, newItem]);
    }
    
    setProductSearch('');
    setShowProductResults(false);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = quantity * updatedItems[index].unitPrice;
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...items];
    updatedItems[index].unitPrice = price;
    updatedItems[index].subtotal = updatedItems[index].quantity * price;
    setItems(updatedItems);
  };

  const handlePriceInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    
    // Allow only numbers and one decimal point
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(value)) {
      // If invalid, revert to previous valid value
      const validValue = value.slice(0, -1);
      input.value = validValue;
    }
  };

  const confirmDeleteItem = (index: number) => {
    setItemToDelete(index);
    setShowDeleteModal(true);
  };

  const deleteItem = () => {
    if (itemToDelete !== null) {
      const updatedItems = items.filter((_, index) => index !== itemToDelete);
      setItems(updatedItems);
      setItemToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const updateInstallmentDate = (index: number, dateStr: string) => {
    const updatedInstallments = [...installments];
    const orderDate = new Date();
    const newDate = new Date(dateStr);
    const daysDue = calculateDaysBetween(orderDate, newDate);
    
    updatedInstallments[index].dueDate = dateStr;
    updatedInstallments[index].daysDue = daysDue;
    setInstallments(updatedInstallments);
  };

  const updateInstallmentDays = (index: number, days: number) => {
    const updatedInstallments = [...installments];
    const orderDate = new Date();
    const newDate = addDaysToDate(orderDate, days);
    
    updatedInstallments[index].daysDue = days;
    updatedInstallments[index].dueDate = formatDateForInput(newDate);
    setInstallments(updatedInstallments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setFormError('Debe seleccionar un cliente');
      return;
    }
    
    if (!selectedSalesperson) {
      setFormError('Debe seleccionar un vendedor');
      return;
    }
    
    if (items.length === 0) {
      setFormError('Debe agregar al menos un producto');
      return;
    }

    try {
      setFormError(null);
      
      const orderData = {
        clientId: selectedClient.id,
        salespersonId: selectedSalesperson,
        status: currentStatus,
        observations: notes,
        paymentType,
        creditType: paymentType === 'credito' ? creditType : undefined,
        installments: paymentType === 'credito' ? installmentCount : undefined,
        createdBy: user?.id || '',
      };

      if (isEditing && id) {
        await updateOrder(id, orderData);
      } else {
        await createOrder(orderData);
      }
      
      navigate('/orders');
    } catch (error) {
      setFormError('Error al guardar el pedido');
    }
  };

  const filteredClients = clients.filter(client =>
    client.commercialName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.businessName.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.ruc.includes(clientSearch)
  );

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                         product.code.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Pedidos
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
        </div>

        {(error || formError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            {error || formError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Cliente</h2>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nombre o RUC..."
                  value={clientSearch}
                  onChange={(e) => handleClientSearch(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {showClientResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{client.commercialName}</div>
                      <div className="text-sm text-gray-600">{client.businessName}</div>
                      <div className="text-sm text-gray-500">RUC: {client.ruc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedClient && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">{selectedClient.commercialName}</h3>
                <p className="text-blue-700">{selectedClient.businessName}</p>
                <p className="text-blue-600">RUC: {selectedClient.ruc}</p>
                <p className="text-blue-600">{selectedClient.address}, {selectedClient.district}</p>
              </div>
            )}
          </div>

          {/* Salesperson Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vendedor</h2>
            {isCurrentUserSalesperson ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{user?.fullName}</p>
                <p className="text-gray-600">{user?.cargo}</p>
              </div>
            ) : (
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar vendedor</option>
                {salespeople.map((salesperson) => (
                  <option key={salesperson.id} value={salesperson.id}>
                    {salesperson.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Productos</h2>
            
            {/* Product Search */}
            <div className="mb-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre o código..."
                      value={productSearch}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showProductResults && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => addProduct(product)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">Código: {product.code}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(product.wholesalePrice)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">Producto</th>
                      <th className="border border-gray-300 p-3 text-center w-24">Cantidad</th>
                      <th className="border border-gray-300 p-3 text-center w-32">Precio Unit.</th>
                      <th className="border border-gray-300 p-3 text-center w-32">Subtotal</th>
                      <th className="border border-gray-300 p-3 text-center w-16">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-600">Código: {item.product?.code}</div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                            onInput={handlePriceInput}
                            className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        <td className="border border-gray-300 p-3 text-center font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="border border-gray-300 p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteItem(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
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
            )}
          </div>

          {/* Payment Terms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Términos de Pago</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pago
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="contado"
                      checked={paymentType === 'contado'}
                      onChange={(e) => setPaymentType(e.target.value as 'contado' | 'credito')}
                      className="mr-2"
                    />
                    Contado
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentType"
                      value="credito"
                      checked={paymentType === 'credito'}
                      onChange={(e) => setPaymentType(e.target.value as 'contado' | 'credito')}
                      className="mr-2"
                    />
                    Crédito
                  </label>
                </div>
              </div>

              {paymentType === 'credito' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Crédito
                      </label>
                      <select
                        value={creditType}
                        onChange={(e) => setCreditType(e.target.value as 'factura' | 'letras')}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="factura">Factura</option>
                        <option value="letras">Letras</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Cuotas
                      </label>
                      <select
                        value={installmentCount}
                        onChange={(e) => setInstallmentCount(parseInt(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num} cuota{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {installments.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Detalle de Cuotas</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 p-3 text-center w-20">Cuota</th>
                              <th className="border border-gray-300 p-3 text-center w-32">Monto</th>
                              <th className="border border-gray-300 p-3 text-center w-40">Fecha</th>
                              <th className="border border-gray-300 p-3 text-center w-24">Días</th>
                            </tr>
                          </thead>
                          <tbody>
                            {installments.map((installment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-3 text-center font-medium">
                                  {installment.installmentNumber}
                                </td>
                                <td className="border border-gray-300 p-3 text-center font-medium">
                                  {formatCurrency(installment.amount)}
                                </td>
                                <td className="border border-gray-300 p-3 text-center">
                                  <input
                                    type="date"
                                    value={installment.dueDate}
                                    onChange={(e) => updateInstallmentDate(index, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                                <td className="border border-gray-300 p-3 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={installment.daysDue || ''}
                                    onChange={(e) => updateInstallmentDays(index, parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100 font-bold">
                              <td className="border border-gray-300 p-3 text-center">Total</td>
                              <td className="border border-gray-300 p-3 text-center">
                                {formatCurrency(installments.reduce((sum, inst) => sum + inst.amount, 0))}
                              </td>
                              <td className="border border-gray-300 p-3"></td>
                              <td className="border border-gray-300 p-3"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status and Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Estado y Observaciones</h2>
            
            <div className="space-y-4">
              {canChangeStatus && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Pedido
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Observaciones adicionales del pedido..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/orders')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={!selectedClient || !selectedSalesperson || items.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Actualizar Pedido' : 'Crear Pedido'}
            </Button>
          </div>
        </form>

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
                <h3 className="font-medium">¿Eliminar producto?</h3>
                <p className="text-sm text-muted-foreground">
                  Esta acción eliminará el producto del pedido.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={deleteItem}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}