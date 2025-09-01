import React from 'react';
import { Package, Tag, DollarSign, Box } from 'lucide-react';
import { Product } from '../../lib/types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  categoryName,
}: ProductDetailModalProps) {
  if (!product) return null;

  const priceItems = [
    { label: 'Precio Mayorista', value: product.wholesalePrice },
    { label: 'Precio Minorista', value: product.retailPrice },
    { label: 'Precio Distribuidor', value: product.distributorPrice },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Producto"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="space-y-4">
          <div className="aspect-square w-80 mx-auto bg-gray-100 rounded-lg overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Product Code */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Código: {product.code}
            </Badge>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          {/* Product Name */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>
            {categoryName && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <Badge>{categoryName}</Badge>
              </div>
            )}
          </div>

          {/* Prices Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Precios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {priceItems.map((item) => (
                <div
                  key={item.label}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Box className="h-5 w-5" />
              Información Adicional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Unidades por Caja</div>
                <div className="text-xl font-bold text-gray-900">
                  {product.unitsPerBox}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Stock Disponible</div>
                <div className="text-xl font-bold text-gray-900">
                  {product.stock || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Creado:</span>{' '}
                {formatDate(new Date(product.createdAt))}
              </div>
              <div>
                <span className="font-medium">Actualizado:</span>{' '}
                {formatDate(new Date(product.updatedAt))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}