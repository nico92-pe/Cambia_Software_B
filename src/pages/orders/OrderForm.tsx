import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Search, X, Package, User, Building } from 'lucide-react';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { useUserStore } from '../../store/user-store';
import { useAuthStore } from '../../store/auth-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { formatCurrency } from '../../lib/utils';
import { UserRole, OrderStatus, Client, Product } from '../../lib/types';

// Interfaces
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

export function OrderForm() {
  console.log('OrderForm: Componente renderizándose correctamente');
  
  // Hooks
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { clients, getClients } = useClientStore();
  const { categories, getCategories } = useProductStore();
  const { getUsersByRole } = useUserStore();
  const { getOrderById, createOrder, updateOrder, addOrderItem, updateOrderItem, removeOrderItem, saveOrderInstallments, isLoading, error } = useOrderStore();
  
  // Determine if current user is salesperson
  const isCurrentUserSalesperson = user?.role === UserRole.ASESOR_VENTAS;
  const isEditMode = Boolean(id);
  
  // Basic state
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [order, setOrder] = useState<any>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientSearchResults, setShowClientSearchResults] = useState(false);
  const [salespeople, setSalespeople] = useState<{ id: string; fullName: string }[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(OrderStatus.BORRADOR);
  const [isDraft, setIsDraft] = useState(true);
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [creditType, setCreditType] = useState<'factura' | 'letras'>('factura');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState<OrderInstallmentForm[]>([]);
  const [installmentStartDate, setInstallmentStartDate] = useState<Date | null>(null);
  
  // Product search and selection
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  // Order items
  const [items, setItems] = useState<OrderFormItem[]>([]);
  
  // Use effect to load data
  useEffect(() => {
    // Prevent multiple loads
    if (isDataLoaded || isFormLoading) {
      return;
    }
    
    const loadData = async () => {
      setIsFormLoading(true);
      try {
        // Load basic data
        await getClients();
        await getCategories();
        
        // Load salespeople if not current user salesperson
        if (!isCurrentUserSalesperson) {
          try {
            const salespeople = await getUsersByRole(UserRole.ASESOR_VENTAS);
            setSalespeople(salespeople);
          } catch (error) {
            console.error('Error loading salespeople:', error);
          }
        } else if (user) {
          setSelectedSalesperson(user.id);
        }
        
        // Load order if editing
        if (isEditMode && id) {
          try {
            const orderData = await getOrderById(id);
            if (orderData) {
              setOrder(orderData);
              // Set form data from order
              setSelectedClient(orderData.client || null);
              setSelectedSalesperson(orderData.salespersonId);
              setCurrentStatus(orderData.status);
              setNotes(orderData.observations || '');
              setPaymentType(orderData.paymentType);
              setCreditType(orderData.creditType || 'factura');
              setInstallmentCount(orderData.installments || 1);
              
              // Convert order items to form items
              const formItems: OrderFormItem[] = orderData.items?.map(item => ({
                id: item.id,
                productId: item.productId,
                product: item.product,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              })) || [];
              setItems(formItems);
              
              // Set installment start date from order creation date
              setInstallmentStartDate(new Date(orderData.createdAt));
              
              // Load installments if credit order
              if (orderData.paymentType === 'credito' && orderData.installmentDetails) {
                const formInstallments: OrderInstallmentForm[] = orderData.installmentDetails.map(inst => ({
                  installmentNumber: inst.installmentNumber,
                  amount: inst.amount,
                  dueDate: inst.dueDate,
                  daysDue: inst.daysDue,
                }));
                setInstallments(formInstallments);
              }
            } else {
              setFormError('Pedido no encontrado');
              navigate('/orders');
              return;
            }
          } catch (error) {
            setFormError('Error al cargar el pedido');
          }
        }
        
      } catch (error) {
        console.error('Error loading form data:', error);
        setFormError('Error al cargar los datos del formulario');
      } finally {
        setIsDataLoaded(true);
        setIsFormLoading(false);
      }
    };
    
    loadData();
  }, []); // Empty dependency array - we control loading with state flags
  
  // Reset loading flag when ID changes (for edit mode)
  useEffect(() => {
    if (id && isDataLoaded) {
      setIsDataLoaded(false);
      setIsFormLoading(false);
    }
  }, [id]);
  
  // Filter clients when salesperson changes
  useEffect(() => {
    if (selectedSalesperson) {
      const clientsForSalesperson = clients.filter(client => client.salespersonId === selectedSalesperson);
      setFilteredClients(clientsForSalesperson);
      
      // Reset selected client if it doesn't belong to the new salesperson
      if (selectedClient && selectedClient.salespersonId !== selectedSalesperson) {
        setSelectedClient(null);
        setClientSearchTerm('');
      }
    } else {
      setFilteredClients([]);
      setSelectedClient(null);
      setClientSearchTerm('');
    }
  }, [selectedSalesperson, clients, selectedClient]);
  
  // Filter clients based on search term
  const displayClients = filteredClients.filter(client => 
    client.commercialName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.businessName.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.ruc.includes(clientSearchTerm)
  );
  
  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.commercialName);
    setShowClientSearchResults(false);
  };
  
  // Handle client search input
  const handleClientSearchChange = (value: string) => {
    setClientSearchTerm(value);
    if (!value.trim()) {
      setSelectedClient(null);
    }
    setShowClientSearchResults(true);
  };
  
  // Clear client selection
  const clearClientSelection = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setShowClientSearchResults(false);
  };
  
  // Product search function
  const searchProducts = async (searchTerm: string, categoryFilter: string) => {
    // Always search, even with empty terms to show all products when no filters
    // if (!searchTerm.trim() && !categoryFilter) {
    //   setSearchResults([]);
    //   return;
    // }
    
    setIsSearching(true);
    try {
      const results = await useProductStore.getState().searchProductsForOrderForm(searchTerm, categoryFilter);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle product search
  const handleProductSearch = (term: string) => {
    setProductSearchTerm(term);
    // Add a small delay to prevent too many API calls while typing
    const timeoutId = setTimeout(() => {
      searchProducts(term, productCategoryFilter);
    }, 300);
    
    // Clear previous timeout
    return () => clearTimeout(timeoutId);
  };
  
  const handleCategoryFilter = (categoryId: string) => {
    setProductCategoryFilter(categoryId);
    searchProducts(productSearchTerm, categoryId);
  };
  
  // Add product to order
  const addProductToOrder = (product: Product) => {
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if product already exists
      updateItemQuantity(existingItem.productId, existingItem.quantity + 1);
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
    
    // Clear search
    setProductSearchTerm('');
    setSearchResults([]);
    setShowProductSearch(false);
  };
  
  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    setItems(items.map(item => {
      if (item.productId === productId) {
        const subtotal = item.unitPrice * quantity;
        return { ...item, quantity, subtotal };
      }
      return item;
    }));
  };
  
  // Update item price
  const updateItemPrice = (productId: string, unitPrice: number) => {
    setItems(items.map(item => {
      if (item.productId === productId) {
        const subtotal = unitPrice * item.quantity;
        return { ...item, unitPrice, subtotal };
      }
      return item;
    }));
  };
  
  // Remove item
  const removeItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };
  
  // Helper functions
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const calculateTotals = () => {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const subtotal = total / 1.18;
    const igv = subtotal * 0.18;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };
  
  const totals = calculateTotals();
  
  // Use order totals if in edit mode and items haven't changed, otherwise use calculated totals
  const displayTotals = isEditMode && order && items.length === (order.items?.length || 0) 
    ? {
        subtotal: order.subtotal,
        igv: order.igv,
        total: order.total,
      }
    : totals;

  // Check if items have been modified (not just count, but actual content)
  const itemsModified = useMemo(() => {
    if (!isEditMode || !order?.items) return false;
    
    // If length is different, definitely modified
    if (items.length !== order.items.length) return true;
    
    // Check if any item has been modified
    return items.some((item, index) => {
      const originalItem = order.items?.[index];
      if (!originalItem) return true;
      
      return (
        item.productId !== originalItem.productId ||
        item.quantity !== originalItem.quantity ||
        item.unitPrice !== originalItem.unitPrice ||
        item.subtotal !== originalItem.subtotal
      );
    });
  }, [items, order?.items, isEditMode]);

  // Use modified logic for displaying totals
  const finalDisplayTotals = isEditMode && order && !itemsModified
    ? {
        subtotal: order.subtotal,
        igv: order.igv,
        total: order.total,
      }
    : totals;

  // Generate installments
  const generateInstallments = () => {
    if (paymentType !== 'credito' || installmentCount <= 0) {
      setInstallments([]);
      return;
    }
    
    // Use today's date as the base for calculating installments
    const startDate = new Date();
    if (!installmentStartDate) {
      setInstallmentStartDate(startDate);
    }
    
    const baseInstallmentAmount = Math.floor((finalDisplayTotals.total * 100) / installmentCount) / 100; // Round down to 2 decimals
    const newInstallments: OrderInstallmentForm[] = [];
    let accumulatedAmount = 0;
    
    for (let i = 1; i <= installmentCount; i++) {
      const daysDue = creditType === 'factura' ? i * 30 : i * 30; // 30 days between installments
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + daysDue);
      
      let installmentAmount;
      if (i === installmentCount) {
        // Last installment: total minus accumulated amount
        installmentAmount = finalDisplayTotals.total - accumulatedAmount;
      } else {
        installmentAmount = baseInstallmentAmount;
        accumulatedAmount += installmentAmount;
      }
      
      newInstallments.push({
        installmentNumber: i,
        amount: Number(installmentAmount.toFixed(2)),
        dueDate: formatDateForInput(dueDate),
        daysDue,
      });
    }
    
    setInstallments(newInstallments);
  };
  
  // Auto-generate installments when payment type, installment count, or totals change
  useEffect(() => {
    if (paymentType === 'credito' && installmentCount > 0 && finalDisplayTotals.total > 0 && installments.length === 0) {
      generateInstallments();
    } else if (paymentType === 'contado') {
      setInstallments([]);
    }
  }, [paymentType, installmentCount, creditType]);
  
  // Update installment count when user changes it
  useEffect(() => {
    if (paymentType === 'credito' && installmentCount > 0 && finalDisplayTotals.total > 0) {
      const startDate = new Date();
      const baseInstallmentAmount = Math.floor((finalDisplayTotals.total * 100) / installmentCount) / 100;
      
      if (installments.length !== installmentCount) {
        const newInstallments: OrderInstallmentForm[] = [];
        let accumulatedAmount = 0;
        
        for (let i = 1; i <= installmentCount; i++) {
          // Try to preserve existing installment data if it exists
          const existingInstallment = installments.find(inst => inst.installmentNumber === i);
          
          const daysDue = existingInstallment?.daysDue || (creditType === 'factura' ? i * 30 : i * 30);
          const dueDate = existingInstallment?.dueDate || (() => {
            const date = new Date(startDate);
            date.setDate(date.getDate() + daysDue);
            return formatDateForInput(date);
          })();
          
          let installmentAmount;
          if (i === installmentCount) {
            // Last installment: total minus accumulated amount
            installmentAmount = finalDisplayTotals.total - accumulatedAmount;
          } else {
            installmentAmount = baseInstallmentAmount;
            accumulatedAmount += installmentAmount;
          }
          
          newInstallments.push({
            installmentNumber: i,
            amount: Number(installmentAmount.toFixed(2)),
            dueDate,
            daysDue,
          });
        }
        
        setInstallments(newInstallments);
      }
    }
  }, [installmentCount, paymentType, creditType]);
  
  // Update installment amounts when total changes but preserve custom dates/days
  useEffect(() => {
    if (paymentType !== 'credito' || installments.length === 0 || finalDisplayTotals.total <= 0) {
      return;
    }
    
    // Only update amounts, preserve existing dates and days
    const baseInstallmentAmount = Math.floor((finalDisplayTotals.total * 100) / installmentCount) / 100;
    let accumulatedAmount = 0;
    
    const updatedInstallments = installments.map((installment, index) => {
      let installmentAmount;
      if (index === installmentCount - 1) {
        // Last installment: total minus accumulated amount
        installmentAmount = finalDisplayTotals.total - accumulatedAmount;
      } else {
        installmentAmount = baseInstallmentAmount;
        accumulatedAmount += installmentAmount;
      }
      
      return {
        ...installment, // Preserve existing dueDate and daysDue
        amount: Number(installmentAmount.toFixed(2)),
      };
    });
    
    setInstallments(updatedInstallments);
  }, [finalDisplayTotals.total, installmentCount, paymentType]);
  
  // Update installment
  const updateInstallment = (index: number, field: keyof OrderInstallmentForm, value: any) => {
    if (!installmentStartDate) return;
    
    const updatedInstallments = [...installments];
    
    if (field === 'dueDate') {
      // When date changes, recalculate days
      const [year, month, day] = value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      const startDate = new Date(installmentStartDate);
      
      // Normalize both dates to midnight UTC for accurate day calculation
      const normalizedNewDate = new Date(newDate);
      normalizedNewDate.setUTCHours(0, 0, 0, 0);
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setUTCHours(0, 0, 0, 0);
      
      const timeDiff = normalizedNewDate.getTime() - normalizedStartDate.getTime();
      const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));
      
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        dueDate: value,
        daysDue: Math.max(0, daysDiff), // Ensure non-negative days
      };
    } else if (field === 'daysDue') {
      // When days change, recalculate date
      const newDays = parseInt(value) || 0;
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + newDays);
      
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        daysDue: newDays,
        dueDate: formatDateForInput(newDate),
      };
    }
    
    setInstallments(updatedInstallments);
  };
  
  // Format date for display (dd/mm/yy)
  const formatDateForDisplay = (dateString: string): string => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDay = String(date.getDate()).padStart(2, '0');
    const formattedMonth = String(date.getMonth() + 1).padStart(2, '0');
    const formattedYear = String(date.getFullYear()).slice(-2);
    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
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
      
      // Recalculate installments if credit payment to ensure latest values
      let installmentsToSave: OrderInstallmentForm[] = [];
      if (paymentType === 'credito' && installmentCount > 0 && finalDisplayTotals.total > 0) {
        const startDate = new Date();
        const baseInstallmentAmount = Math.floor((finalDisplayTotals.total * 100) / installmentCount) / 100;
        let accumulatedAmount = 0;
        
        for (let i = 1; i <= installmentCount; i++) {
          const daysDue = creditType === 'factura' ? i * 30 : i * 30;
          const dueDate = new Date(startDate);
          dueDate.setDate(dueDate.getDate() + daysDue);
          
          let installmentAmount;
          if (i === installmentCount) {
            installmentAmount = finalDisplayTotals.total - accumulatedAmount;
          } else {
            installmentAmount = baseInstallmentAmount;
            accumulatedAmount += installmentAmount;
          }
          
          installmentsToSave.push({
            installmentNumber: i,
            amount: Number(installmentAmount.toFixed(2)),
            dueDate: formatDateForInput(dueDate),
            daysDue,
          });
        }
      }
      
      const orderData = {
        clientId: selectedClient.id,
        salespersonId: selectedSalesperson,
        status: currentStatus,
        observations: notes,
        paymentType,
        creditType: paymentType === 'credito' ? creditType : undefined,
        installments: paymentType === 'credito' ? installmentCount : undefined,
        createdBy: user!.id,
      };
      
      let savedOrder;
      if (isEditMode && id) {
        savedOrder = await updateOrder(id, orderData);
      } else {
        savedOrder = await createOrder(orderData);
      }
      
      // Save order items
      if (savedOrder) {
        // Remove existing items if editing
        if (isEditMode && order?.items) {
          for (const item of order.items) {
            if (item.id) {
              await removeOrderItem(item.id);
            }
          }
        }
        
        // Add new items
        for (const item of items) {
          await addOrderItem(savedOrder.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
        
        // Save installments if credit order
        if (paymentType === 'credito' && installmentsToSave.length > 0) {
          await saveOrderInstallments(savedOrder.id, installmentsToSave);
        } else if (paymentType === 'contado') {
          // Clear installments if payment type changed to cash
          await saveOrderInstallments(savedOrder.id, []);
        }
      }
      
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      setFormError(error instanceof Error ? error.message : 'Error al guardar el pedido');
    }
  };
  
  if (!isDataLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando formulario...</p>
        </div>
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

      {formError && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {formError}
        </Alert>
      )}

      <div className="space-y-6">
        {/* Client and Salesperson Selection */}
        <div className="card animate-in fade-in duration-500">
          <div className="card-header">
            <h2 className="card-title text-xl">Información Básica</h2>
            <p className="card-description">
              Selecciona el cliente y vendedor para este pedido
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Vendedor *
                </label>
                {isCurrentUserSalesperson ? (
                  <input
                    type="text"
                    className="input bg-gray-50"
                    value={user?.fullName || ''}
                    disabled
                    readOnly
                  />
                ) : (
                  <select
                    className="select"
                    value={selectedSalesperson}
                    onChange={(e) => setSelectedSalesperson(e.target.value)}
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

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Cliente *
                </label>
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Building size={18} />
                    </div>
                    <input
                      type="text"
                      className="input pl-10 pr-10"
                      placeholder={selectedSalesperson ? 'Buscar cliente por nombre o RUC...' : 'Primero selecciona un vendedor'}
                      value={clientSearchTerm}
                      onChange={(e) => handleClientSearchChange(e.target.value)}
                      onFocus={() => setShowClientSearchResults(true)}
                      disabled={!selectedSalesperson}
                    />
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={clearClientSelection}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showClientSearchResults && selectedSalesperson && clientSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {displayClients.length > 0 ? (
                        displayClients.map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{client.commercialName}</p>
                                <p className="text-sm text-gray-500">{client.businessName}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{client.ruc}</p>
                              <p className="text-xs text-gray-500">{client.district}, {client.province}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          No se encontraron clientes
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedSalesperson && filteredClients.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Este vendedor no tiene clientes asignados
                  </p>
                )}
                {selectedClient && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Cliente seleccionado:</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearClientSelection}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium text-blue-900">{selectedClient.commercialName}</p>
                      <p className="text-sm text-blue-700">{selectedClient.businessName}</p>
                      <p className="text-sm text-blue-600">RUC: {selectedClient.ruc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title text-xl">Productos</h2>
                <p className="card-description">
                  Agrega productos a este pedido
                </p>
              </div>
              <Button
                icon={<Plus size={18} />}
                onClick={() => setShowProductSearch(true)}
              >
                Agregar Producto
              </Button>
            </div>
          </div>
          <div className="card-content">
            {/* Product Search Modal */}
            {showProductSearch && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex min-h-screen items-center justify-center p-4">
                  <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowProductSearch(false)} />
                  <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h3 className="text-lg font-semibold">Buscar Productos</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowProductSearch(false)}
                      >
                        <X size={20} />
                      </Button>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="md:col-span-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Buscar por nombre o código..."
                              value={productSearchTerm}
                              onChange={(e) => handleProductSearch(e.target.value)}
                              className="input pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <select
                            className="select"
                            value={productCategoryFilter}
                            onChange={(e) => handleCategoryFilter(e.target.value)}
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
                      
                      <div className="max-h-96 overflow-y-auto">
                        {isSearching ? (
                          <div className="flex justify-center py-8">
                            <Loader />
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => addProductToOrder(product)}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">Código: {product.code}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(product.wholesalePrice)}</p>
                                  <p className="text-sm text-gray-500">Stock: {product.stock || 0}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {productSearchTerm || productCategoryFilter ? 'No se encontraron productos' : 'Busca productos para agregar al pedido'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items Table */}
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <div className="font-medium">{item.product?.name}</div>
                              <div className="text-sm text-gray-500">Código: {item.product?.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                            className="w-24 text-center border border-gray-300 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(finalDisplayTotals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(finalDisplayTotals.igv)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(finalDisplayTotals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay productos agregados al pedido
              </div>
            )}
          </div>
        </div>

        {/* Payment and Credit Information */}
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">Información de Pago</h2>
            <p className="card-description">
              Configura el tipo de pago y condiciones de crédito
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Tipo de Pago
                </label>
                <select
                  className="select"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as 'contado' | 'credito')}
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              {paymentType === 'credito' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Tipo de Crédito
                    </label>
                    <select
                      className="select"
                      value={creditType}
                      onChange={(e) => setCreditType(e.target.value as 'factura' | 'letras')}
                    >
                      <option value="factura">Factura</option>
                      <option value="letras">Letras</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Número de Cuotas
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={installmentCount}
                        readOnly
                        className="input text-center w-16 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => setInstallmentCount(Math.max(1, installmentCount - 1))}
                        disabled={installmentCount <= 1}
                        className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallmentCount(Math.min(12, installmentCount + 1))}
                        disabled={installmentCount >= 12}
                        className="flex items-center justify-center w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +1
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Installments Table */}
            {paymentType === 'credito' && installments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Detalle de Cuotas</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuota
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha de Vencimiento
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Días
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {installments.map((installment, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                            {installment.installmentNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="font-medium text-gray-900">
                              {formatCurrency(installment.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="font-medium text-gray-900">
                              {formatDateForDisplay(installment.dueDate)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <input
                              type="number"
                              value={installment.daysDue}
                              onChange={(e) => updateInstallment(index, 'daysDue', parseInt(e.target.value) || 0)}
                              className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
              <div className="space-y-2">
                <label className="block text-sm font-medium mt-6">
                  Observaciones
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input resize-none"
                  placeholder="Observaciones adicionales del pedido..."
                />
              </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            Cancelar
          </Button>
          <Button
            icon={<Save size={18} />}
            onClick={handleSubmit}
            loading={isLoading}
          >
            {isEditMode ? 'Actualizar Pedido' : 'Crear Pedido'}
          </Button>
        </div>
      </div>
    </div>
  );
}