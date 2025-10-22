import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { useProductStore } from '../../store/product-store';
import { Product } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

interface ProductEditRow {
  id: string;
  name: string;
  code: string;
  categoryName: string;
  unitsPerBox: number;
  stock: number;
  originalUnitsPerBox: number;
  originalStock: number;
}

export function BulkStockEdit() {
  const navigate = useNavigate();
  const { categories, getCategories, getAllProductsForCatalog, bulkUpdateProducts, isLoading, error } = useProductStore();

  const [products, setProducts] = useState<ProductEditRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    loadProducts();
    getCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingData(true);
      const allProducts = await getAllProductsForCatalog();

      const productRows: ProductEditRow[] = allProducts.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        categoryName: product.categoryName,
        unitsPerBox: product.unitsPerBox,
        stock: product.stock || 0,
        originalUnitsPerBox: product.unitsPerBox,
        originalStock: product.stock || 0,
      }));

      setProducts(productRows);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUnitsPerBoxChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, unitsPerBox: numValue } : p
      )
    );
  };

  const handleStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, stock: numValue } : p
      )
    );
  };

  const hasChanges = () => {
    return products.some(p =>
      p.unitsPerBox !== p.originalUnitsPerBox ||
      p.stock !== p.originalStock
    );
  };

  const getChangedProducts = () => {
    return products.filter(p =>
      p.unitsPerBox !== p.originalUnitsPerBox ||
      p.stock !== p.originalStock
    );
  };

  const handleSaveClick = () => {
    if (!hasChanges()) {
      setSaveError('No hay cambios para guardar');
      return;
    }
    setShowConfirmModal(true);
    setSaveError(null);
  };

  const handleConfirmSave = async () => {
    try {
      setSaveLoading(true);
      setSaveError(null);

      const changedProducts = getChangedProducts();
      const updates = changedProducts.map(p => ({
        id: p.id,
        unitsPerBox: p.unitsPerBox,
        stock: p.stock,
      }));

      await bulkUpdateProducts(updates);

      setShowConfirmModal(false);

      await loadProducts();

      setSaveError(null);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Error al guardar los cambios'
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando productos...</p>
        </div>
      </div>
    );
  }

  const changedProducts = getChangedProducts();

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Editar Stock</h1>
          <p className="text-muted-foreground mt-1">
            Actualiza las cantidades de stock y unidades por caja de forma masiva
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/products')}
          >
            Volver
          </Button>
          <Button
            icon={<Save size={18} />}
            onClick={handleSaveClick}
            disabled={!hasChanges() || saveLoading}
            loading={saveLoading}
          >
            Guardar Cambios
          </Button>
        </div>
      </header>

      {(error || saveError) && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error || saveError}
        </Alert>
      )}

      {hasChanges() && (
        <Alert className="mb-6 animate-in fade-in duration-300">
          Hay {changedProducts.length} producto(s) con cambios sin guardar
        </Alert>
      )}

      <div className="card animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No hay productos</h3>
              <p className="mt-1 text-muted-foreground">
                No se encontraron productos para editar
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                    Unidades/Caja
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const hasProductChanges =
                    product.unitsPerBox !== product.originalUnitsPerBox ||
                    product.stock !== product.originalStock;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-muted/30 ${hasProductChanges ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Código: {product.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>{product.categoryName}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          className={`input w-full ${
                            product.unitsPerBox !== product.originalUnitsPerBox
                              ? 'border-blue-500 ring-1 ring-blue-500'
                              : ''
                          }`}
                          value={product.unitsPerBox}
                          onChange={(e) => handleUnitsPerBoxChange(product.id, e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          className={`input w-full ${
                            product.stock !== product.originalStock
                              ? 'border-blue-500 ring-1 ring-blue-500'
                              : ''
                          }`}
                          value={product.stock}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        title="Confirmar Cambios"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ¿Está seguro de que desea guardar los cambios realizados?
          </p>

          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium mb-2">
              Se actualizarán {changedProducts.length} producto(s):
            </p>
            <ul className="space-y-1 text-sm max-h-60 overflow-y-auto">
              {changedProducts.map(product => (
                <li key={product.id} className="text-muted-foreground">
                  <span className="font-medium">{product.name}</span>
                  {product.unitsPerBox !== product.originalUnitsPerBox && (
                    <span> - Unidades/Caja: {product.originalUnitsPerBox} → {product.unitsPerBox}</span>
                  )}
                  {product.stock !== product.originalStock && (
                    <span> - Stock: {product.originalStock} → {product.stock}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancelSave}
              disabled={saveLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmSave}
              loading={saveLoading}
              icon={<Save size={18} />}
            >
              Confirmar y Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
