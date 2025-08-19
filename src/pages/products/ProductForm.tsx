import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Barcode, DollarSign, Package, Save, Upload, X } from 'lucide-react';
import { Product } from '../../lib/types';
import { useProductStore } from '../../store/product-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, getCategories, createProduct, updateProduct, isLoading, error } = useProductStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductFormData>();

  useEffect(() => {
    const loadData = async () => {
      await getCategories();
      
      if (id) {
        const product = products.find(p => p.id === id);
        if (product) {
          reset(product);
          if (product.imageUrl) {
            setImagePreview(product.imageUrl);
          }
        } else {
          navigate('/products');
        }
      }
    };

    loadData();
  }, [id, products, getCategories, reset, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo purposes, we'll use a placeholder URL
      // In a real app, you would upload to a storage service like Supabase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setValue('imageUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue('imageUrl', '');
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setFormError(null);
      
      const productData = {
        ...data,
        wholesalePrice: Number(data.wholesalePrice),
        retailPrice: Number(data.retailPrice),
        distributorPrice: Number(data.distributorPrice),
        creditPrice: Number(data.creditPrice),
        cashPrice: Number(data.cashPrice),
        unitsPerBox: Number(data.unitsPerBox),
        stock: Number(data.stock || 0),
      };
      
      if (isEditMode && id) {
        await updateProduct(id, productData);
      } else {
        await createProduct(productData);
      }
      
      navigate('/products');
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Error al guardar el producto');
      }
    }
  };

  if (isLoading && isEditMode) {
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
            {isEditMode ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Actualiza la información del producto' : 'Añade un nuevo producto al catálogo'}
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/products')}
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
          <h2 className="card-title text-xl">Información del Producto</h2>
          <p className="card-description">
            Ingresa los datos del producto
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload Section */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium">
                  Imagen del Producto
                </label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Seleccionar imagen
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      Formatos soportados: JPG, PNG, GIF. Tamaño máximo: 5MB
                    </p>
                  </div>
                </div>
                <input
                  type="hidden"
                  {...register('imageUrl')}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium">
                  Código *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Barcode size={18} />
                  </div>
                  <input
                    id="code"
                    type="text"
                    className={`input pl-10 ${errors.code ? 'border-destructive' : ''}`}
                    placeholder="A001"
                    {...register('code', {
                      required: 'El código es requerido',
                    })}
                  />
                </div>
                {errors.code && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="categoryId" className="block text-sm font-medium">
                  Categoría *
                </label>
                <select
                  id="categoryId"
                  className={`select ${errors.categoryId ? 'border-destructive' : ''}`}
                  {...register('categoryId', {
                    required: 'La categoría es requerida',
                  })}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nombre del Producto *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Package size={18} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    className={`input pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    placeholder="Nombre del Producto"
                    {...register('name', {
                      required: 'El nombre es requerido',
                    })}
                  />
                </div>
                {errors.name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-medium text-lg mb-4">Precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="wholesalePrice" className="block text-sm font-medium">
                    Precio Mayorista *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    </div>
                    <input
                      id="wholesalePrice"
                      type="number"
                      step="0.01"
                      className={`input ${errors.wholesalePrice ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      {...register('wholesalePrice', {
                        required: 'El precio es requerido',
                        min: {
                          value: 0,
                          message: 'El precio debe ser mayor a 0',
                        },
                      })}
                    />
                  </div>
                  {errors.wholesalePrice && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.wholesalePrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="retailPrice" className="block text-sm font-medium">
                    Precio Minorista *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <DollarSign size={18} />
                    </div>
                    <input
                      id="retailPrice"
                      type="number"
                      step="0.01"
                      className={`input pl-10 ${errors.retailPrice ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      {...register('retailPrice', {
                        required: 'El precio es requerido',
                        min: {
                          value: 0,
                          message: 'El precio debe ser mayor a 0',
                        },
                      })}
                    />
                  </div>
                  {errors.retailPrice && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.retailPrice.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="distributorPrice" className="block text-sm font-medium">
                    Precio Distribuidor *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <DollarSign size={18} />
                    </div>
                    <input
                      id="distributorPrice"
                      type="number"
                      step="0.01"
                      className={`input pl-10 ${errors.distributorPrice ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      {...register('distributorPrice', {
                        required: 'El precio es requerido',
                        min: {
                          value: 0,
                          message: 'El precio debe ser mayor a 0',
                        },
                      })}
                    />
                  </div>
                  {errors.distributorPrice && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.distributorPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="creditPrice" className="block text-sm font-medium">
                    Precio Crédito *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <DollarSign size={18} />
                    </div>
                    <input
                      id="creditPrice"
                      type="number"
                      step="0.01"
                      className={`input pl-10 ${errors.creditPrice ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      {...register('creditPrice', {
                        required: 'El precio es requerido',
                        min: {
                          value: 0,
                          message: 'El precio debe ser mayor a 0',
                        },
                      })}
                    />
                  </div>
                  {errors.creditPrice && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.creditPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cashPrice" className="block text-sm font-medium">
                    Precio Contado *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <DollarSign size={18} />
                    </div>
                    <input
                      id="cashPrice"
                      type="number"
                      step="0.01"
                      className={`input pl-10 ${errors.cashPrice ? 'border-destructive' : ''}`}
                      placeholder="0.00"
                      {...register('cashPrice', {
                        required: 'El precio es requerido',
                        min: {
                          value: 0,
                          message: 'El precio debe ser mayor a 0',
                        },
                      })}
                    />
                  </div>
                  {errors.cashPrice && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.cashPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="unitsPerBox" className="block text-sm font-medium">
                    Unidades por Caja *
                  </label>
                  <input
                    id="unitsPerBox"
                    type="number"
                    className={`input ${errors.unitsPerBox ? 'border-destructive' : ''}`}
                    placeholder="1"
                    {...register('unitsPerBox', {
                      required: 'Este campo es requerido',
                      min: {
                        value: 1,
                        message: 'Debe ser al menos 1',
                      },
                    })}
                  />
                  {errors.unitsPerBox && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.unitsPerBox.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="stock" className="block text-sm font-medium">
                  Stock Inicial
                </label>
                <input
                  id="stock"
                  type="number"
                  className={`input ${errors.stock ? 'border-destructive' : ''}`}
                  placeholder="0"
                  {...register('stock', {
                    min: {
                      value: 0,
                      message: 'El stock no puede ser negativo',
                    },
                  })}
                />
                {errors.stock && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.stock.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/products')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                icon={<Save size={18} />}
                loading={isLoading}
              >
                {isEditMode ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}