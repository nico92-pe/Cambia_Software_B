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

  const isEditing = !!id;
  const canEdit = user?.role === UserRole.ADMIN || user?.role === UserRole.VENDEDOR;
  const canChangeStatus = user?.role === UserRole.ADMIN;

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal;

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

        {error && (
          <Alert variant="error" className="mb-6">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Form Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Información del Pedido</h2>
              <p className="text-gray-600">Formulario de pedido en desarrollo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
  