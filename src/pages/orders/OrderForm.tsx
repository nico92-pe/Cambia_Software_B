import React, { useState, useEffect } from 'react';
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
  
  // Simulate loading for now
  useEffect(() => {
    console.log('OrderForm: useEffect ejecutándose');
    setTimeout(() => {
      console.log('OrderForm: Estableciendo isDataLoaded = true');
      setIsDataLoaded(true);
    }, 100);
  }, []);
  
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
      <h1>OrderForm con imports y estado básico</h1>
      <p>Si ves este mensaje, las importaciones y el estado básico funcionan correctamente.</p>
      {formError && (
        <Alert variant="destructive" className="mt-4">
          {formError}
        </Alert>
      )}
    </div>
  );
}