import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, Save, Trash2, X, Package, User, CreditCard, FileText, AlertTriangle } from 'lucide-react';
import { Order, OrderItem, Product, Client, User as UserType, OrderStatus } from '../../lib/types';
import { useOrderStore } from '../../store/order-store';
import { useClientStore } from '../../store/client-store';
import { useProductStore } from '../../store/product-store';
import { useUserStore } from '../../store/user-store';
import { useAuthStore } from '../../store/auth-store';
import { UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency } from '../../lib/utils';

interface OrderFormData {
  clientId: string;
  salespersonId: string;
  observations: string;
  paymentType: 'contado' | 'credito';
  creditType?: 'factura' | 'letras';
  installments?: number;
}

interface OrderFormItem extends Omit<OrderItem, 'id' | 'orderId' | 'createdAt'> {
  product?: Product;
  pulsadorType?: 'pequeño' | 'grande';
}

export function OrderForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { createOrder, updateOrder, getOrderById, addOrderItem, updateOrderItem, removeOrderItem, isLoading, error } = useOrderStore();
  const { clients, getClients } = useClientStore();
  const { products, getProducts } = useProductStore();
  const { getUsersByRole } = useUserStore();
  const { user: currentUser } = useAuthStore();
  
  const [salespeople, setSalespeople] = useState<UserType[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [items, setItems] = useState<OrderFormItem[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: number }>({});
  const [subtotal, setSubtotal] = useState(0);
  const [igv, setIgv] = useState(0);
  const [total, setTotal] = useState(0);
  const [installmentDays, setInstallmentDays] = useState<number[]>([]);
  
  const isEditMode = Boolean(id);
  const isCurrentUserSalesperson = currentUser?.role === UserRole.ASESOR_VENTAS;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<OrderFormData>();

  const paymentType = watch('paymentType');
  const creditType = watch('creditType');
  const installments = watch('installments');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          getClients(),
          getProducts(),
        ]);

        const salespeopleData = await getUsersByRole(UserRole.ASESOR_VENTAS);
        setSalespeople(salespeopleData);

        if (id) {
          const order = await getOrderById(id);
          if (order) {
            reset({
              clientId: order.clientId,
              salespersonId: order.salespersonId,
              observations: order.observations || '',
              paymentType: order.paymentType,
              creditType: order.creditType,
              installments: order.installments,
            });

            const formItems: OrderFormItem[] = order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              product: item.product,
              pulsadorType: item.pulsadorType,
            }));
            
            setItems(formItems);
            
            if (order.installmentDetails) {
              setInstallmentDays(order.installmentDetails.map(inst => inst.daysDue));
            }
          }
        } else if (isCurrentUserSalesperson && currentUser) {
          setValue('salespersonId', currentUser.id);
        }
      } catch (error) {
        setFormError('Error al cargar los datos');
      }
    };

    loadData();
  }, [id, getClients, getProducts, getUsersByRole, getOrderById, reset, setValue, isCurrentUserSalesperson, currentUser]);

  // Calculate totals when items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newIgv = newSubtotal * 0.18;
    const newTotal = newSubtotal + newIgv;
    
    setSubtotal(newSubtotal);
    setIgv(newIgv);
    setTotal(newTotal);
  }, [items]);

  // Update installment days when installments change
  useEffect(() => {
    if (installments && installments > 0) {
      const days = Array.from({ length: installments }, (_, i) => (i + 1) * 30);
      setInstallmentDays(days);
    }
  }, [installments]);

  const addProductsToOrder = () => {
    const newItems: OrderFormItem[] = [];
    
    Object.entries(selectedProducts).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const unitPrice = paymentType === 'credito' ? product.creditPrice : product.cashPrice;
          const subtotal = quantity * unitPrice;
          
          // Check if it's a Kit Ahorrador that needs pulsador selection
          const isKitAhorrador = isKitAhorradorProduct(product);
          
          newItems.push({
            productId,
            quantity,
            unitPrice,
            subtotal,
            product,
            pulsadorType: isKitAhorrador ? 'pequeño' : undefined,
          });
        }
      }
    });
    
    setItems(prev => [...prev, ...newItems]);
    setSelectedProducts({});
    setShowProductModal(false);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const newSubtotal = quantity * item.unitPrice;
        return { ...item, quantity, subtotal: newSubtotal };
      }
      return item;
    }));
  };

  const updateItemPulsador = (index: number, pulsadorType: 'pequeño' | 'grande') => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, pulsadorType };
      }
      return item;
    }));
  };

  const isKitAhorradorProduct = (product: Product): boolean => {
    const kitMatch = product.name.toLowerCase().match(/kit\s*ahorrador\s*(\d+)/);
    if (!kitMatch) return false;
    
    const kitNumber = parseInt(kitMatch[1]);
    return [3, 4, 5, 6, 9, 10].includes(kitNumber);
  };

  const splitKitItem = (index: number) => {
    const item = items[index];
    if (item.quantity <= 1) return;
    
    const halfQuantity = Math.floor(item.quantity / 2);
    const remainingQuantity = item.quantity - halfQuantity;
    
    const newItems = [...items];
    
    // Update original item
    newItems[index] = {
      ...item,
      quantity: halfQuantity,
      subtotal: halfQuantity * item.unitPrice,
      pulsadorType: 'pequeño'
    };
    
    // Add new item with remaining quantity
    newItems.splice(index + 1, 0, {
      ...item,
      quantity: remainingQuantity,
      subtotal: remainingQuantity * item.unitPrice,
      pulsadorType: 'grande'
    });
    
    setItems(newItems);
  };

  const unifyKitItems = (index: number) => {
    const item = items[index];
    const nextItem = items[index + 1];
    
    if (!nextItem || nextItem.productId !== item.productId) return;
    
    const totalQuantity = item.quantity + nextItem.quantity;
    const newItems = [...items];
    
    // Update first item with combined quantity
    newItems[index] = {
      ...item,
      quantity: totalQuantity,
      subtotal: totalQuantity * item.unitPrice,
      pulsadorType: 'pequeño' // Default back to pequeño
    };
    
    // Remove the second item
    newItems.splice(index + 1, 1);
    
    setItems(newItems);
  };

  const updateInstallmentDay = (index: number, days: number) => {
    setInstallmentDays(prev => prev.map((day, i) => i === index ? days : day));
  };

  const onSubmit = async (data: OrderFormData) => {
    if (items.length === 0) {
      setFormError('Debe agregar al menos un producto al pedido');
      return;
    }

    try {
      setFormError(null);
      
      const orderData = {
        ...data,
        createdBy: currentUser?.id || '',
        status: OrderStatus.BORRADOR,
      };

      let order: Order;
      
      if (isEditMode && id) {
        order = await updateOrder(id, orderData);
        
        // Update existing items or add new ones
        for (const item of items) {
          await addOrderItem(order.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            pulsadorType: item.pulsadorType,
          });
        }
      } else {
        order = await createOrder(orderData);
        
        // Add all items to the new order
        for (const item of items) {
          await addOrderItem(order.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            pulsadorType: item.pulsadorType,
          });
        }
      }

      // Handle installments for credit orders
      if (data.paymentType === 'credito' && data.installments && installmentDays.length > 0) {
        const installmentAmount = total / data.installments;
        
        for (let i = 0; i < data.installments; i++) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + installmentDays[i]);
          
          await supabase.from('order_installments').insert({
            order_id: order.id,
            installment_number: i + 1,
            amount: installmentAmount,
            due_date: dueDate.toISOString().split('T')[0],
            days_due: installmentDays[i],
          });
        }
      }
      
      navigate('/orders');
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Error al guardar el pedido');
      }
    }
  };

  // Filter Kit Ahorrador items that need pulsador selection
  const kitAhorradorItems = items.filter((item, index) => 
    item.product && isKitAhorradorProduct(item.product)
  ).map((item, originalIndex) => ({
    ...item,
    originalIndex: items.findIndex(i => i === item)
  }));

  if (isLoading) {
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
            {isEditMode ? 'Actualiza la información del pedido' : 'Crea un nuevo pedido para el cliente'}
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

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header">
          <h2 className="card-title text-xl">Información del Pedido</h2>
          <p className="card-description">
            Completa los datos del pedido
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Client and Salesperson Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="clientId" className="block text-sm font-medium">
                  Cliente *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <User size={18} />
                  </div>
                  <select
                    id="clientId"
                    className={`select pl-10 ${errors.clientId ? 'border-destructive' : ''}`}
                    {...register('clientId', {
                      required: 'El cliente es requerido',
                    })}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.commercialName} - {client.ruc}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.clientId && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonId" className="block text-sm font-medium">
                  Vendedor Asignado *
                </label>
                {isCurrentUserSalesperson ? (
                  <div>
                    <input
                      type="text"
                      className="input bg-gray-50"
                      value={currentUser?.fullName || ''}
                      disabled
                      readOnly
                    />
                    <input
                      type="hidden"
                      {...register('salespersonId', {
                        required: 'El vendedor es requerido',
                      })}
                    />
                  </div>
                ) : (
                  <select
                    id="salespersonId"
                    className={`select ${errors.salespersonId ? 'border-destructive' : ''}`}
                    {...register('salespersonId', {
                      required: 'El vendedor es requerido',
                    })}
                  >
                    <option value="">Seleccionar vendedor</option>
                    {salespeople.map((salesperson) => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.fullName}
                      </option>
                    ))}
                  </select>
                )}
                {errors.salespersonId && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.salespersonId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Products Section */}
            <div className="border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium">Productos del Pedido</h3>
                <Button
                  type="button"
                  variant="outline"
                  icon={<Plus size={18} />}
                  onClick={() => setShowProductModal(true)}
                >
                  Agregar Productos
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No hay productos</h3>
                  <p className="mt-1 text-gray-500">
                    Agrega productos para crear el pedido
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                          <p className="text-sm text-gray-500">Código: {item.product?.code}</p>
                          <p className="text-sm text-gray-500">
                            Precio unitario: {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Cantidad:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kit Ahorrador Pulsador Selection */}
            {kitAhorradorItems.length > 0 && (
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-medium mb-6">Configuración de Pulsadores</h3>
                <div className="space-y-6">
                  {kitAhorradorItems.map(({ originalIndex, product, quantity, pulsadorType }) => {
                    const nextItem = items[originalIndex + 1];
                    const canSplit = quantity > 1;
                    const canUnify = nextItem && nextItem.productId === product?.id;
                    
                    return (
                      <div key={originalIndex} className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{product?.name}</h4>
                            <p className="text-sm text-gray-500">Código: {product?.code}</p>
                            <p className="text-sm text-gray-500">Cantidad: {quantity}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium whitespace-nowrap">Tipo de pulsador:</label>
                              <select
                                value={pulsadorType || 'pequeño'}
                                onChange={(e) => updateItemPulsador(originalIndex, e.target.value as 'pequeño' | 'grande')}
                                className="px-3 py-1 border border-gray-300 rounded text-sm w-full sm:w-48"
                              >
                                <option value="pequeño">Pulsador dual pequeño</option>
                                <option value="grande">Pulsador dual grande</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              {canSplit && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => splitKitItem(originalIndex)}
                                  className="text-xs whitespace-nowrap"
                                >
                                  Dividir pulsadores
                                </Button>
                              )}
                              {canUnify && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => unifyKitItems(originalIndex)}
                                  className="text-xs whitespace-nowrap bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                  Unificar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Terms */}
            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-lg font-medium mb-6">Términos de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Tipo de Pago *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="contado"
                        {...register('paymentType', {
                          required: 'El tipo de pago es requerido',
                        })}
                        className="mr-2"
                      />
                      <span>Contado</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="credito"
                        {...register('paymentType', {
                          required: 'El tipo de pago es requerido',
                        })}
                        className="mr-2"
                      />
                      <span>Crédito</span>
                    </label>
                  </div>
                  {errors.paymentType && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.paymentType.message}
                    </p>
                  )}
                </div>

                {paymentType === 'credito' && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Tipo de Crédito *
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="factura"
                            {...register('creditType', {
                              required: paymentType === 'credito' ? 'El tipo de crédito es requerido' : false,
                            })}
                            className="mr-2"
                          />
                          <span>Factura</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="letras"
                            {...register('creditType', {
                              required: paymentType === 'credito' ? 'El tipo de crédito es requerido' : false,
                            })}
                            className="mr-2"
                          />
                          <span>Letras</span>
                        </label>
                      </div>
                      {errors.creditType && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.creditType.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="installments" className="block text-sm font-medium">
                        Número de Cuotas *
                      </label>
                      <select
                        id="installments"
                        className={`select ${errors.installments ? 'border-destructive' : ''}`}
                        {...register('installments', {
                          required: paymentType === 'credito' ? 'El número de cuotas es requerido' : false,
                        })}
                      >
                        <option value="">Seleccionar cuotas</option>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num} cuota{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      {errors.installments && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.installments.message}
                        </p>
                      )}
                    </div>

                    {installments && installments > 0 && (
                      <div className="md:col-span-2 space-y-4">
                        <h4 className="font-medium">Configuración de Cuotas</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Array.from({ length: installments }, (_, i) => (
                            <div key={i} className="space-y-2">
                              <label className="block text-sm font-medium">
                                Cuota {i + 1} - Días
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={installmentDays[i] || (i + 1) * 30}
                                onChange={(e) => updateInstallmentDay(i, parseInt(e.target.value) || 30)}
                                className="input"
                              />
                              <p className="text-xs text-gray-500">
                                Monto: {formatCurrency(total / installments)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Observations */}
            <div className="border-t border-gray-100 pt-8">
              <div className="space-y-2">
                <label htmlFor="observations" className="block text-sm font-medium">
                  Observaciones
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-muted-foreground">
                    <FileText size={18} />
                  </div>
                  <textarea
                    id="observations"
                    rows={4}
                    className="input pl-10 resize-none"
                    placeholder="Observaciones adicionales del pedido..."
                    {...register('observations')}
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-medium mb-4">Resumen del Pedido</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGV (18%):</span>
                      <span className="font-medium">{formatCurrency(igv)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/orders')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={<Save size={18} />}
                loading={isLoading}
                disabled={items.length === 0}
              >
                {isEditMode ? 'Actualizar Pedido' : 'Crear Pedido'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Product Selection Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Seleccionar Productos"
        size="xl"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-500">Código: {product.code}</p>
                    <p className="text-sm text-gray-500">
                      Precio: {formatCurrency(paymentType === 'credito' ? product.creditPrice : product.cashPrice)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={selectedProducts[product.id] || 0}
                      onChange={(e) => setSelectedProducts(prev => ({
                        ...prev,
                        [product.id]: parseInt(e.target.value) || 0
                      }))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowProductModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={addProductsToOrder}>
              Agregar Productos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}