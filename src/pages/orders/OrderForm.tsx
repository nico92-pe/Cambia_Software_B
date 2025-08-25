import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
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
import { formatCurrency, formatDate } from '../../lib/utils';

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
  pulsadorType?: 'pequeño' | 'grande';
  pulsadorPequenoQty?: number;
  pulsadorGrandeQty?: number;
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

// Helper function to format date for display (dd/mm/yyyy)
const formatDateForDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
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
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [creditType, setCreditType] = useState<'factura' | 'letras'>('factura');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number; subtotal: number }>>([]);
  const [installments, setInstallments] = useState<OrderInstallmentForm[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [salespeople, setSalespeople] = useState([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showProductResults, setShowProductResults] = useState(false);

  const isEditing = !!id;
  const canEdit = user?.role !== UserRole.ASESOR_VENTAS || !isEditing;
  const canChangeStatus = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isCurrentUserSalesperson = user?.role === UserRole.ASESOR_VENTAS;
  
  // Check if asesor can edit this order
  const canAsesorEdit = !isCurrentUserSalesperson || !order || ['borrador', 'tomado'].includes(order.status);

  // Calculate totals - ensure we have valid numbers
  const total = items.reduce((sum, item) => {
    const itemSubtotal = typeof item.subtotal === 'number' ? item.subtotal : 0;
    return sum + itemSubtotal;
  }, 0);
  const subtotal = total / 1.18;
  const igv = total - subtotal;
  
  console.log('Calculated totals:', { total, subtotal, igv, itemsCount: items.length });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsDataLoaded(false);
      
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
            setIsDraft(orderData.status === OrderStatus.BORRADOR);
            
            // Convert order items to form items
            const formItems: OrderFormItem[] = orderData.items.map(item => ({
              id: item.id,
              productId: item.productId,
              product: item.product,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: typeof item.subtotal === 'number' && item.subtotal > 0 
                ? item.subtotal 
                : Number((item.quantity * item.unitPrice).toFixed(2)),
              pulsadorType: item.pulsadorType,
              pulsadorPequenoQty: item.pulsadorPequenoQty,
              pulsadorGrandeQty: item.pulsadorGrandeQty,
              pulsadorPequenoQty: item.pulsadorPequenoQty || 0,
              pulsadorGrandeQty: item.pulsadorGrandeQty || 0,
            }));
            setItems(formItems);
            
            console.log('Loaded order items with subtotals:', formItems.map(item => ({
              name: item.product?.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              calculated: item.quantity * item.unitPrice
            })));

            // Load installments if credit order
            if (orderData.paymentType === 'credito' && orderData.installmentDetails) {
              const formInstallments: OrderInstallmentForm[] = orderData.installmentDetails.map(inst => ({
                installmentNumber: inst.installmentNumber,
                amount: inst.amount,
                dueDate: formatDateForInput(new Date(inst.dueDate)),
                daysDue: inst.daysDue,
              }));
              setInstallments(formInstallments);
              console.log('Loaded installments:', formInstallments);
            }
            
            setIsDataLoaded(true);
          }
        } catch (error) {
          setFormError('Error al cargar el pedido');
          setIsDataLoaded(true);
        }
      } else if (isCurrentUserSalesperson && user) {
        // Pre-select current user as salesperson for new orders
        setSelectedSalesperson(user.id);
        setIsDataLoaded(true);
      } else {
        setIsDataLoaded(true);
      }
    };

    loadData();
  }, [id, getOrderById, getClients, getProducts, getCategories, getUsersByRole, isCurrentUserSalesperson, user]);

  // Generate installments when payment type changes to credit
  useEffect(() => {
    if (paymentType === 'credito' && total > 0 && installments.length === 0 && !isEditing) {
      generateInstallments();
    } else if (paymentType === 'contado') {
      setInstallments([]);
    }
  }, [paymentType, installmentCount, total, isEditing]);

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
    
    // Auto-select the client's salesperson
    setSelectedSalesperson(client.salespersonId || '');
  };

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    setShowProductResults(value.length > 0);
  };

  const addProduct = (product: Product) => {
    const existingItemIndex = items.findIndex(item => item.productId === product.id);
      (item) => item.product.id === product.id
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].subtotal = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      setItems(updatedItems);
    } else {
      // Add new item
      const isKitAhorrador = product.name.toLowerCase().includes('kit ahorrador');
      const newItem: OrderFormItem = {
        productId: product.id,
        product,
        quantity: 1,
        unitPrice: product.wholesalePrice,
        subtotal: Number(product.wholesalePrice.toFixed(2)),
        pulsadorType: isKitAhorrador ? 'pequeño' : undefined,
      };
      setItems([...items, newItem]);
    }
    
    setProductSearch('');
    setShowProductResults(false);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].subtotal = Number((quantity * updatedItems[index].unitPrice).toFixed(2));
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const updatedItems = [...items];
    updatedItems[index].unitPrice = price;
    updatedItems[index].subtotal = Number((updatedItems[index].quantity * price).toFixed(2));
    setItems(updatedItems);
  };

  const updateItemPulsador = (index: number, pulsadorType: 'pequeño' | 'grande') => {
    const updatedItems = [...items];
    updatedItems[index].pulsadorType = pulsadorType;
    setItems(updatedItems);
  };

  const updatePulsadorDistribution = (index: number, pequenoQty: number, grandeQty: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    
    // Validate that distribution doesn't exceed total quantity
    const totalDistribution = pequenoQty + grandeQty;
    if (totalDistribution > item.quantity) {
      // Adjust the last changed value to fit within limits
      const maxAllowed = item.quantity - (totalDistribution - Math.max(pequenoQty, grandeQty));
      if (pequenoQty > grandeQty) {
        pequenoQty = Math.max(0, maxAllowed);
      } else {
        grandeQty = Math.max(0, maxAllowed);
      }
    }
    
    updatedItems[index].pulsadorPequenoQty = pequenoQty;
    updatedItems[index].pulsadorGrandeQty = grandeQty;
    setItems(updatedItems);
  };

  // Filter Kit Ahorrador items (3, 4, 5, 6, 9, 10)
  const kitAhorradorItems = items.filter(item => {
    const name = item.product?.name.toLowerCase() || '';
    return name.includes('kit ahorrador') && /\b(3|4|5|6|9|10)\b/.test(name);
  });

  // State for managing pulsador divisions
  const [pulsadorDivisions, setPulsadorDivisions] = useState<Record<string, boolean>>({});

  const togglePulsadorDivision = (productId: string) => {
    setPulsadorDivisions(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const splitKitItem = (index: number) => {
    const item = items[index];
    if (item.quantity <= 1) return;
    
    const updatedItems = [...items];
    // Split into individual items
    updatedItems.splice(index, 1);
    
    for (let i = 0; i < item.quantity; i++) {
      updatedItems.push({
        ...item,
        quantity: 1,
        subtotal: item.unitPrice,
      });
    }
    
    setItems(updatedItems);
  };

  const mergeKitItems = (productId: string) => {
    const productItems = items.filter(item => item.productId === productId);
    if (productItems.length <= 1) return;
    
    const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
    const firstItem = productItems[0];
    
    const updatedItems = items.filter(item => item.productId !== productId);
    updatedItems.push({
      ...firstItem,
      quantity: totalQuantity,
      subtotal: Number((totalQuantity * firstItem.unitPrice).toFixed(2)),
    });
    
    setItems(updatedItems);
  };

  const handlePriceInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const value = input.value;
    
    // Allow only numbers and one decimal point with max 2 decimal places
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

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    
    if (!selectedClient) {
      setFormError('Debe seleccionar un cliente');
      return;
    }
    
    if (!selectedClient.salespersonId && !selectedSalesperson) {
      setFormError('El cliente debe tener un vendedor asignado');
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
        salespersonId: selectedClient.salespersonId || selectedSalesperson,
        status: isCurrentUserSalesperson ? currentStatus : (isEditing && order ? order.status : (saveAsDraft ? OrderStatus.BORRADOR : OrderStatus.CONFIRMADO)),
        observations: notes,
        paymentType,
        creditType: paymentType === 'credito' ? creditType : undefined,
        installments: paymentType === 'credito' ? installmentCount : undefined,
        createdBy: user?.id || '',
      };

      let orderId = id;
      
      if (isEditing && id) {
        await updateOrder(id, orderData);
      } else {
        const newOrder = await createOrder(orderData);
        orderId = newOrder.id;
      }

      // Update order items
      if (orderId) {
        // Remove existing items if editing
        if (isEditing && order?.items) {
          for (const existingItem of order.items) {
            await removeOrderItem(orderId, existingItem.id);
          }
        }

        // Add current items
        for (const item of items) {
          const orderItemData = {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            pulsadorType: item.pulsadorType,
            pulsadorPequenoQty: item.pulsadorPequenoQty,
            pulsadorGrandeQty: item.pulsadorGrandeQty,
          };
          
          await addOrderItem(orderId, orderItemData);
        }
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
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  // Check if user can edit this order
  if (isEditing && !canAsesorEdit) {
    return (
      <div className="max-w-3xl mx-auto">
        <Alert variant="destructive" className="mb-6">
          No tienes permisos para editar este pedido. Los asesores de ventas solo pueden editar pedidos en estado "Borrador" o "Tomado".
        </Alert>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/orders')}
        >
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
            {isEditing ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Actualiza la información del pedido' : 'Crea un nuevo pedido en el sistema'}
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

      {(error || formError) && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error || formError}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Client Selection */}
        <div className="card animate-in fade-in duration-500">
          <div className="card-header">
            <h2 className="card-title text-xl">Cliente</h2>
            <p className="card-description">
              Selecciona el cliente para este pedido
            </p>
          </div>
          <div className="card-content">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nombre o RUC..."
                value={clientSearch}
                onChange={(e) => handleClientSearch(e.target.value)}
                className="input pl-10 w-full"
              />
              
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
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-medium text-gray-900">{selectedClient.commercialName}</h3>
                <p className="text-gray-700">{selectedClient.businessName}</p>
                <p className="text-gray-600">RUC: {selectedClient.ruc}</p>
                <p className="text-gray-600">{selectedClient.address}, {selectedClient.district}</p>
                {(selectedClient.salesperson || salespeople.find(s => s.id === selectedClient.salespersonId)) && (
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">Vendedor:</span> {
                      selectedClient.salesperson?.fullName || 
                      salespeople.find(s => s.id === selectedClient.salespersonId)?.fullName ||
                      'No disponible'
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Productos</h2>
            <p className="card-description">
              Agrega productos al pedido
            </p>
          </div>
          <div className="card-content">
            {/* Product Search */}
            <div className="mb-4 space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o código..."
                  value={productSearch}
                  onChange={(e) => handleProductSearch(e.target.value)}
                  className="input pl-10 w-full"
                />
                
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
              
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="select w-full"
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
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-600">Código: {item.product?.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || ''}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                            onInput={handlePriceInput}
                            className="w-24 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => confirmDeleteItem(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Totals */}
                {items.length > 0 && (
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
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Payment Terms */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Términos de Pago</h2>
            <p className="card-description">
              Configura los términos de pago del pedido
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
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
                      <label className="block text-sm font-medium mb-2">
                        Tipo de Crédito
                      </label>
                      <select
                        value={creditType}
                        onChange={(e) => setCreditType(e.target.value as 'factura' | 'letras')}
                        className="select w-full"
                      >
                        <option value="factura">Factura</option>
                        <option value="letras">Letras</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número de Cuotas
                      </label>
                    <select
                      value={installmentCount}
                      onChange={(e) => {
                        setInstallmentCount(parseInt(e.target.value));
                        console.log(e.target.value);
                      }}
                      className="select w-full"
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
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Cuota
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Monto
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Días
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {installments.map((installment, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                                  {installment.installmentNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                                  {formatCurrency(installment.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="date"
                                    value={installment.dueDate}
                                    onChange={(e) => updateInstallmentDate(index, e.target.value)}
                                    className="w-44 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={installment.daysDue || ''}
                                    onChange={(e) => updateInstallmentDays(index, parseInt(e.target.value) || 0)}
                                    className="w-28 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-primary focus:border-transparent"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan={4} className="px-6 py-4">
                                <div className="flex justify-end">
                                  <div className="w-64">
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                      <span>Total Cuotas:</span>
                                      <span>{formatCurrency(installments.reduce((sum, inst) => sum + inst.amount, 0))}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
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
        </div>

        {/* Notes */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Observaciones</h2>
            <p className="card-description">
              Notas adicionales del pedido
            </p>
          </div>
          <div className="card-content">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="input w-full resize-none"
              placeholder="Observaciones adicionales del pedido..."
            />
          </div>
        </div>

        {/* Order Status - Only for Asesor de Ventas */}
        {isCurrentUserSalesperson && (
          <div className="card animate-in fade-in duration-500" style={{ animationDelay: '450ms' }}>
            <div className="card-header">
              <h2 className="card-title text-xl">Estado del Pedido</h2>
              <p className="card-description">
                Selecciona el estado del pedido
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderStatus"
                        value={OrderStatus.BORRADOR}
                        checked={currentStatus === OrderStatus.BORRADOR}
                        onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                        className="mr-2"
                      />
                      Borrador
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderStatus"
                        value={OrderStatus.TOMADO}
                        checked={currentStatus === OrderStatus.TOMADO}
                        onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
                        className="mr-2"
                      />
                      Tomado
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4 animate-in fade-in duration-500" style={{ animationDelay: '500ms' }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            Cancelar
          </Button>
          {!isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              loading={isLoading}
              disabled={!selectedClient || items.length === 0}
            >
              Guardar Borrador
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            loading={isLoading}
            disabled={!selectedClient || items.length === 0}
          >
            <Save size={18} className="mr-2" />
            {isEditing ? 'Actualizar Pedido' : 'Confirmar Pedido'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertTriangle className="text-destructive flex-shrink-0" size={20} />
            <p className="text-sm">
              ¿Estás seguro de que deseas eliminar este producto del pedido?
            </p>
          </div>
          <div className="flex justify-end gap-3">
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
  );
}