import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';
import { toYYYYMMDD } from '../../lib/utils';
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
  const { searchClientsForOrderForm } = useClientStore();
  const { categories, getCategories } = useProductStore();
  const { getUsersByRole } = useUserStore();
  const { getOrderById, createOrder, updateOrder, addOrderItem, updateOrderItem, removeOrderItem, saveOrderInstallments, isLoading, error } = useOrderStore();

  // Ref for search timeout
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
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
  const [clientSearchResults, setClientSearchResults] = useState<Client[]>([]);
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

  // Stock warning modal
  const [showStockWarning, setShowStockWarning] = useState(false);
  const [stockWarningProduct, setStockWarningProduct] = useState<Product | null>(null);

  // Order items
  const [items, setItems] = useState<OrderFormItem[]>([]);
  
  // Determine if the order is read-only
  const isReadOnly = useMemo(() => {
    if (!isEditMode || !order || !user?.role) return false;
    
    // For admin and super_admin, only allow editing if status is borrador or tomado
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return !['borrador', 'tomado'].includes(order.status);
    }
    
    // For asesor_ventas, only allow editing if status is borrador or tomado
    if (user.role === UserRole.ASESOR_VENTAS) {
      return !['borrador', 'tomado'].includes(order.status);
    }
    
    return false;
  }, [isEditMode, order, user?.role]);
  
  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset search when modal closes
  useEffect(() => {
    if (!showProductSearch) {
      setProductSearchTerm('');
      setSearchResults([]);
      setProductCategoryFilter('');
      setIsSearching(false);

      // Clear any pending search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [showProductSearch]);

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
              
              // Set fixed installment start date from order creation date
              const createdDate = new Date(orderData.createdAt);
              setInstallmentStartDate(new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()));
              
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
        } else {
          // For new orders, set a fixed start date
          const today = new Date();
          setInstallmentStartDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
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
  
  // Load clients when salesperson changes
  useEffect(() => {
    const loadClientsForSalesperson = async () => {
      if (selectedSalesperson) {
        try {
          // Load all clients for the selected salesperson
          const clients = await searchClientsForOrderForm('', selectedSalesperson);
          setClientSearchResults(clients);
          
          // Reset selected client if it doesn't belong to the new salesperson
          if (selectedClient && selectedClient.salespersonId !== selectedSalesperson) {
            setSelectedClient(null);
            setClientSearchTerm('');
          }
        } catch (error) {
          console.error('Error loading clients for salesperson:', error);
          setClientSearchResults([]);
        }
      } else {
        setClientSearchResults([]);
        setSelectedClient(null);
        setClientSearchTerm('');
      }
    };
    
    loadClientsForSalesperson();
  }, [selectedSalesperson, selectedClient, searchClientsForOrderForm]);
  
  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.commercialName);
    setShowClientSearchResults(false);
  };
  
  // Handle client search input
  const handleClientSearchChange = async (value: string) => {
    setClientSearchTerm(value);
    if (!value.trim()) {
      setSelectedClient(null);
      // Load all clients for the salesperson when search is cleared
      if (selectedSalesperson) {
        try {
          const clients = await searchClientsForOrderForm('', selectedSalesperson);
          setClientSearchResults(clients);
        } catch (error) {
          console.error('Error loading clients:', error);
        }
      }
    } else {
      // Search clients with the search term
      if (selectedSalesperson) {
        try {
          const clients = await searchClientsForOrderForm(value, selectedSalesperson);
          setClientSearchResults(clients);
        } catch (error) {
          console.error('Error searching clients:', error);
          setClientSearchResults([]);
        }
      }
    }
    setShowClientSearchResults(true);
  };
  
  // Clear client selection
  const clearClientSelection = () => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setShowClientSearchResults(false);
  };
  
  // Product search function with debouncing
  const searchProducts = useCallback(async (searchTerm: string, categoryFilter: string) => {
    // Only search if there's a search term or category filter
    if (!searchTerm.trim() && !categoryFilter) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Require at least 2 characters for text search
    if (searchTerm.trim() && searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

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
  }, []);
  
  // Handle product search with proper debouncing
  const handleProductSearch = useCallback((term: string) => {
    setProductSearchTerm(term);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set loading state immediately for better UX
    if (term.trim()) {
      setIsSearching(true);
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(term, productCategoryFilter);
    }, 500);
  }, [productCategoryFilter, searchProducts]);
  
  const handleCategoryFilter = useCallback((categoryId: string) => {
    setProductCategoryFilter(categoryId);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Search immediately when category changes
    searchProducts(productSearchTerm, categoryId);
  }, [productSearchTerm, searchProducts]);
  
  // Add product to order
  const addProductToOrder = (product: Product) => {
    // Check if stock is 100 units or less
    if (product.stock <= 100) {
      setStockWarningProduct(product);
      setShowStockWarning(true);
    }

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

    // Clear search and close modal
    setProductSearchTerm('');
    setSearchResults([]);
    setProductCategoryFilter('');
    setShowProductSearch(false);

    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  };
  
  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    const safeQuantity = Math.max(0, quantity);

    setItems(items.map(item => {
      if (item.productId === productId) {
        const subtotal = item.unitPrice * safeQuantity;
        return { ...item, quantity: safeQuantity, subtotal };
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
  const generateInstallments = useCallback((prevInstallments: OrderInstallmentForm[] = []) => {
    if (paymentType !== 'credito' || installmentCount <= 0) {
      return [];
    }
    
    // Use fixed installment start date
    const startDate = installmentStartDate!; // We ensure this is always set
    
    const total = finalDisplayTotals.total;
    const baseInstallmentAmount = total > 0 ? Math.floor((total * 100) / installmentCount) / 100 : 0;
    const newInstallments: OrderInstallmentForm[] = [];
    let accumulatedAmount = 0;
    
    for (let i = 1; i <= installmentCount; i++) {
      // Look for existing installment data to preserve
      const existingInstallment = prevInstallments.find(inst => inst.installmentNumber === i);
      
      let dueDate: string;
      let daysDue: number;
      
      if (existingInstallment && typeof existingInstallment.daysDue === 'number') {
        // PRESERVE existing daysDue - this is the key fix
        // Only change if user explicitly edits the daysDue field
        daysDue = existingInstallment.daysDue;
        
        // Recalculate dueDate based on preserved daysDue to ensure consistency
        const calculatedDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        calculatedDate.setDate(calculatedDate.getDate() + daysDue);
        dueDate = toYYYYMMDD(calculatedDate);
      } else {
        // Generate new due date and daysDue ONLY for new installments
        const defaultDays = creditType === 'factura' ? i * 30 : i * 30;
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        date.setDate(date.getDate() + defaultDays);
        dueDate = toYYYYMMDD(date);
        daysDue = defaultDays;
      }
      
      let installmentAmount;
      if (total > 0) {
        if (i === installmentCount) {
          // Last installment: total minus accumulated amount
          installmentAmount = total - accumulatedAmount;
        } else {
          installmentAmount = baseInstallmentAmount;
          accumulatedAmount += installmentAmount;
        }
      } else {
        installmentAmount = 0;
      }
      
      newInstallments.push({
        installmentNumber: i,
        amount: Number(installmentAmount.toFixed(2)),
        dueDate,
        daysDue,
      });
    }
    
    return newInstallments;
  }, [paymentType, installmentCount, creditType, finalDisplayTotals.total, installmentStartDate]);
  
  // Main useEffect for installment generation
  useEffect(() => {
    console.log('Installment generation useEffect triggered:', {
      paymentType,
      installmentCount,
      currentInstallmentsLength: installments.length
    });
    
    if (paymentType === 'credito' && installmentCount > 0) {
      setInstallments(prevInstallments => {
        const newInstallments = generateInstallments(prevInstallments);
        console.log('Generated installments:', newInstallments);
        return newInstallments;
      });
    } else {
      console.log('Clearing installments - payment type is contado');
      setInstallments([]);
    }
  }, [paymentType, installmentCount, generateInstallments]);
  
  // Update installment
  const updateInstallment = (index: number, field: keyof OrderInstallmentForm, value: any) => {
    const updatedInstallments = [...installments];
    const baseDate = installmentStartDate!; // We ensure this is always set
    
    if (field === 'daysDue') {
      // When days change, recalculate date
      const days = Math.max(0, parseInt(value) || 0);
      const newDate = new Date(baseDate);
      newDate.setDate(newDate.getDate() + days);
      
      updatedInstallments[index] = {
        ...updatedInstallments[index],
        daysDue: days,
        dueDate: toYYYYMMDD(newDate),
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
        // Use current installments state to preserve user-edited dates
        installmentsToSave = installments.map(installment => ({
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          dueDate: installment.dueDate, // Preserve fixed due date
          daysDue: installment.daysDue,
        }));
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
            subtotal: item.subtotal,
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
          {isReadOnly && (
            <div className="mt-2">
              <Badge variant="warning" className="text-sm">
                Solo lectura - Este pedido no puede ser modificado en su estado actual
              </Badge>
            </div>
          )}
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
                    disabled={isReadOnly}
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
                      disabled={!selectedSalesperson || isReadOnly}
                    />
                    {selectedClient && (
                      <button
                        type="button"
                        onClick={clearClientSelection}
                        disabled={isReadOnly}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showClientSearchResults && selectedSalesperson && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {clientSearchResults.length > 0 ? (
                        clientSearchResults.map((client) => (
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
                {selectedSalesperson && clientSearchResults.length === 0 && !clientSearchTerm && (
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
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={clearClientSelection}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X size={16} />
                        </button>
                      )}
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
              {!isReadOnly && (
                <Button
                  icon={<Plus size={18} />}
                  onClick={() => setShowProductSearch(true)}
                >
                  Agregar Producto
                </Button>
              )}
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
                              placeholder="Buscar por nombre o código"
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
                          <div className="flex flex-col items-center justify-center py-12">
                            <Loader size="lg" />
                            <p className="text-sm text-gray-500 mt-3">Buscando productos...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => addProductToOrder(product)}
                              >
                                <div className="flex items-center gap-3">
                                  <Package className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-sm text-gray-500">{product.code}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(product.wholesalePrice)}</p>
                                  <p className="text-sm text-gray-500">Stock: {product.stock || 0}</p>
                                </div>
                              </div>
                            ))}
                            {searchResults.length === 100 && (
                              <div className="text-center py-2 text-sm text-amber-600 bg-amber-50 rounded">
                                Se muestran los primeros 100 resultados. Refina tu búsqueda para ver más.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            {productSearchTerm || productCategoryFilter ? (
                              <div>
                                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">No se encontraron productos</p>
                                <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
                              </div>
                            ) : (
                              <div>
                                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">Busca productos</p>
                                <p className="text-sm mt-1">Escribe al menos 2 caracteres o selecciona una categoría</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items - Desktop Table View */}
            {items.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto">
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
                        {!isReadOnly && (
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        )}
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
                            {isReadOnly ? (
                              <span className="font-medium">{item.quantity}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={item.quantity === 0 ? '' : item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateItemQuantity(item.productId, 0);
                                  } else {
                                    updateItemQuantity(item.productId, parseInt(value) || 0);
                                  }
                                }}
                                className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {isReadOnly ? (
                              <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unitPrice === 0 ? '' : item.unitPrice}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateItemPrice(item.productId, 0);
                                  } else {
                                    updateItemPrice(item.productId, parseFloat(value) || 0);
                                  }
                                }}
                                className="w-24 text-center border border-gray-300 rounded px-2 py-1"
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                            {formatCurrency(item.subtotal)}
                          </td>
                          {!isReadOnly && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={16} />}
                                onClick={() => removeItem(item.productId)}
                                className="text-red-600 hover:text-red-700"
                              />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Items - Mobile Card View */}
                <div className="block md:hidden space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <Package className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{item.product?.name}</div>
                            <div className="text-sm text-gray-500">{item.product?.code}</div>
                          </div>
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 hover:text-red-700 p-2 -mt-2 -mr-2"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cantidad
                          </label>
                          {isReadOnly ? (
                            <div className="text-lg font-semibold text-gray-900">{item.quantity}</div>
                          ) : (
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  updateItemQuantity(item.productId, 0);
                                } else {
                                  updateItemQuantity(item.productId, parseInt(value) || 0);
                                }
                              }}
                              className="w-full h-12 text-center text-lg border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-colors"
                              placeholder="0"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Precio Unitario
                          </label>
                          {isReadOnly ? (
                            <div className="text-lg font-semibold text-gray-900">{formatCurrency(item.unitPrice)}</div>
                          ) : (
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '') {
                                  updateItemPrice(item.productId, 0);
                                } else {
                                  updateItemPrice(item.productId, parseFloat(value) || 0);
                                }
                              }}
                              className="w-full h-12 text-center text-lg border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-20 transition-colors"
                              placeholder="0.00"
                            />
                          )}
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Subtotal</span>
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(item.subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-6 flex justify-end">
                  <div className="w-full md:w-64 space-y-2 bg-gray-50 p-4 rounded-lg">
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
              </>
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
                  disabled={isReadOnly}
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
                      disabled={isReadOnly}
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
                      {!isReadOnly && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Installments Table */}
            {paymentType === 'credito' && installments.length > 0 && finalDisplayTotals.total > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Detalle de Cuotas</h3>

                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  <div className="space-y-4">
                    {installments.map((installment, index) => (
                      <div key={installment.installmentNumber} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">Cuota {installment.installmentNumber}</h4>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(installment.amount)}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vencimiento:</span>
                            <span className="font-medium">{formatDateForDisplay(installment.dueDate)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Días:</span>
                            {isReadOnly ? (
                              <span className="font-medium">{installment.daysDue} días</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={installment.daysDue === 0 ? '' : installment.daysDue}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateInstallment(index, 'daysDue', 0);
                                  } else {
                                    updateInstallment(index, 'daysDue', parseInt(value) || 0);
                                  }
                                }}
                                className="w-24 text-center border border-gray-300 rounded px-3 py-1.5 font-medium"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block">
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
                          <tr key={installment.installmentNumber}>
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
                              {isReadOnly ? (
                                <span className="font-medium text-gray-600">{installment.daysDue} días</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={installment.daysDue === 0 ? '' : installment.daysDue}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                      updateInstallment(index, 'daysDue', 0);
                                    } else {
                                      updateInstallment(index, 'daysDue', parseInt(value) || 0);
                                    }
                                  }}
                                  className="w-20 text-center border border-gray-300 rounded px-2 py-1"
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  disabled={isReadOnly}
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
          {!isReadOnly && (
            <Button
              icon={<Save size={18} />}
              onClick={handleSubmit}
              loading={isLoading}
            >
              {isEditMode ? 'Actualizar Pedido' : 'Crear Pedido'}
            </Button>
          )}
        </div>
      </div>

      {/* Stock Warning Modal */}
      <Modal
        isOpen={showStockWarning}
        onClose={() => setShowStockWarning(false)}
        title="Advertencia de Stock"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Producto:</span>{' '}
                <span className="font-semibold text-gray-900">{stockWarningProduct?.name}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Stock disponible:</span>{' '}
                <span className="font-semibold text-gray-900">{stockWarningProduct?.stock || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowStockWarning(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}