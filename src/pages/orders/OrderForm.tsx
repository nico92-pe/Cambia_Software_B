import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Search, X } from 'lucide-react';
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('');
  const [salespeople, setSalespeople] = useState<{ id: string; fullName: string }[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(OrderStatus.BORRADOR);
  const [isDraft, setIsDraft] = useState(true);
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'contado' | 'credito'>('contado');
  const [creditType, setCreditType] = useState<'factura' | 'letras'>('factura');
  const [installmentCount, setInstallmentCount] = useState(1);
  const [installments, setInstallments] = useState<OrderInstallmentForm[]>([]);
  
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
    
    console.log('OrderForm: useEffect ejecutándose');
    
    const loadData = async () => {
      setIsFormLoading(true);
      try {
        console.log('OrderForm: Iniciando carga de datos');
        
        // Load basic data
        console.log('OrderForm: Cargando clientes...');
        await getClients();
        console.log('OrderForm: Clientes cargados');
        
        console.log('OrderForm: Cargando categorías...');
        await getCategories();
        console.log('OrderForm: Categorías cargadas');
        
        // Load salespeople if not current user salesperson
        if (!isCurrentUserSalesperson) {
          console.log('OrderForm: Cargando vendedores...');
          try {
            const salespeople = await getUsersByRole(UserRole.ASESOR_VENTAS);
            console.log('OrderForm: Vendedores cargados:', salespeople);
            setSalespeople(salespeople);
          } catch (error) {
            console.error('OrderForm: Error cargando vendedores:', error);
          }
        } else if (user) {
          console.log('OrderForm: Usuario actual es vendedor, usando sus datos');
          setSelectedSalesperson(user.id);
        }
        
        // Load order if editing
        if (isEditMode && id) {
          console.log('OrderForm: Cargando pedido para editar...');
          try {
            const orderData = await getOrderById(id);
            if (orderData) {
              console.log('OrderForm: Pedido cargado:', orderData);
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
              console.error('OrderForm: Pedido no encontrado');
              setFormError('Pedido no encontrado');
              navigate('/orders');
              return;
            }
          } catch (error) {
            console.error('OrderForm: Error cargando pedido:', error);
            setFormError('Error al cargar el pedido');
          }
        }
        
        console.log('OrderForm: Carga de datos completada');
        
      } catch (error) {
        console.error('OrderForm: Error durante la carga de datos:', error);
        setFormError('Error al cargar los datos del formulario');
      } finally {
        console.log('OrderForm: Estableciendo isDataLoaded = true');
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
  
  // Helper functions
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };
  
  const totals = calculateTotals();
  
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
      <h1>OrderForm con carga de datos optimizada</h1>
      <p>Los datos se han cargado correctamente sin renders infinitos.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3>Estado de carga:</h3>
        <ul className="list-disc list-inside mt-2">
          <li>Clientes cargados: {clients.length}</li>
          <li>Categorías cargadas: {categories.length}</li>
          <li>Vendedores cargados: {salespeople.length}</li>
          <li>Usuario actual: {user?.fullName}</li>
          <li>Es vendedor: {isCurrentUserSalesperson ? 'Sí' : 'No'}</li>
          <li>Modo edición: {isEditMode ? 'Sí' : 'No'}</li>
        </ul>
      </div>
      {formError && (
        <Alert variant="destructive" className="mt-4">
          {formError}
        </Alert>
      )}
    </div>
  );
}