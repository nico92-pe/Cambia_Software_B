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

interface OrderInstallmentForm {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  daysDue: number;
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
  