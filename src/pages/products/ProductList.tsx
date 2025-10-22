import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Edit, Package, Plus, Search, Tag, Trash, ChevronLeft, ChevronRight, Download, PackageCheck } from 'lucide-react';
import { useProductStore } from '../../store/product-store';
import { useAuthStore } from '../../store/auth-store';
import { ProductDetailModal } from '../../components/products/ProductDetailModal';
import { ProductCatalogDownloadModal } from '../../components/products/ProductCatalogDownloadModal';
import { generateProductCatalogPDF } from '../../lib/pdf-generator';
import { Product, UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';

export function ProductList() {
  const { products, categories, totalProducts, getProducts, getCategories, getAllProductsForCatalog, deleteProduct, isLoading, fetchLoading, error } = useProductStore();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const PRODUCTS_PER_PAGE = 10;
  
  // Calculate pagination values
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts);
  
  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };
  
  const isAsesorVentas = user?.role === UserRole.ASESOR_VENTAS;
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    getProducts(currentPage, PRODUCTS_PER_PAGE, debouncedSearchTerm, categoryFilter);
  }, [getProducts, currentPage, debouncedSearchTerm, categoryFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      try {
        setDeleteLoading(id);
        setDeleteError(null);
        await deleteProduct(id);
      } catch (error) {
        if (error instanceof Error) {
          setDeleteError(error.message);
        } else {
          setDeleteError('Error al eliminar el producto');
        }
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDownloadClick = () => {
    setIsDownloadModalOpen(true);
    setDownloadError(null);
  };

  const handleDownloadCatalog = async (withStock: boolean) => {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      const allProducts = await getAllProductsForCatalog();

      if (allProducts.length === 0) {
        setDownloadError('No hay productos disponibles para generar el catálogo');
        return;
      }

      await generateProductCatalogPDF(allProducts, withStock);

      setIsDownloadModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloadError(
        error instanceof Error
          ? error.message
          : 'Error al generar el catálogo PDF'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloseDownloadModal = () => {
    if (!isDownloading) {
      setIsDownloadModalOpen(false);
      setDownloadError(null);
    }
  };

  // Show loading screen during initial load
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<Download size={18} />}
            onClick={handleDownloadClick}
          >
            Descargar
          </Button>
          <Link to="/products/categories">
            <Button variant="outline" icon={<Tag size={18} />}>
              Categorías
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/products/bulk-stock-edit">
              <Button variant="outline" icon={<PackageCheck size={18} />}>
                Editar Stock
              </Button>
            </Link>
          )}
          {!isAsesorVentas && (
            <Link to="/products/new">
              <Button icon={<Plus size={18} />}>Nuevo Producto</Button>
            </Link>
          )}
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error}
        </Alert>
      )}

      {deleteError && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {deleteError}
        </Alert>
      )}

      {downloadError && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {downloadError}
        </Alert>
      )}

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative col-span-2">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Search size={18} />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Loader size="sm" />
                </div>
              )}
            </div>
            <div>
              <select
                className="select"
                value={categoryFilter}
                onChange={handleCategoryFilter}
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
        </div>
        <div className="overflow-x-auto relative">
          {fetchLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Loader size="lg" />
                <p className="text-muted-foreground mt-4">Cargando productos...</p>
              </div>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader size="lg" />
                <p className="text-muted-foreground mt-4">Cargando productos...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Box className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No se encontraron productos</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm || categoryFilter
                  ? 'No hay resultados para tu búsqueda'
                  : 'Comienza creando un nuevo producto'}
              </p>
              {!searchTerm && !categoryFilter && (
                <>
                  {!isAsesorVentas && (
                    <Link to="/products/new" className="mt-6 inline-block">
                      <Button icon={<Plus size={18} />}>Nuevo Producto</Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden">
                <div className="space-y-4 p-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleProductClick(product)}
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleProductClick(product)}
                            >
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <h3 
                              className="font-medium text-gray-900 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleProductClick(product)}
                            >
                              {product.name}
                            </h3>
                            <p 
                              className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleProductClick(product)}
                            >
                              Código: {product.code}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Categoría:</span>
                          <Badge>
                            {getCategoryName(product.categoryId)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Precio Minorista:</span>
                          <span className="font-medium">{formatCurrency(product.retailPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Precio Mayorista:</span>
                          <span className="font-medium">{formatCurrency(product.wholesalePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Precio Distribuidor:</span>
                          <span className="font-medium">{formatCurrency(product.distributorPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Unidades/Caja:</span>
                          <span>{product.unitsPerBox}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stock:</span>
                          <span className="font-medium">{product.stock || 0}</span>
                        </div>
                      </div>
                      {!isAsesorVentas && (
                        <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                          <Link to={`/products/edit/${product.id}`}>
                            <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash size={16} />}
                            onClick={() => handleDelete(product.id)}
                            loading={deleteLoading === product.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop Table View */}
              <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                <thead className="bg-muted hidden sm:table-header-group">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Imagen
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Producto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Categoría
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Precio Minorista
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Precio Mayorista
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Precio Distribuidor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Unidades/Caja
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stock
                    </th>
                    {!isAsesorVentas && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 hidden sm:table-row-group">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleProductClick(product)}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => handleProductClick(product)}
                          >
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleProductClick(product)}
                          >
                            {product.name}
                          </div>
                          <div 
                            className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleProductClick(product)}
                          >
                            Código: {product.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge>
                          {getCategoryName(product.categoryId)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{formatCurrency(product.retailPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{formatCurrency(product.wholesalePrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{formatCurrency(product.distributorPrice)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{product.unitsPerBox}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{product.stock || 0}</div>
                      </td>
                      {!isAsesorVentas && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end space-x-2">
                            <Link to={`/products/edit/${product.id}`}>
                              <Button variant="ghost" size="sm" icon={<Edit size={16} />} className="hidden sm:inline-flex" />
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash size={16} />}
                              onClick={() => handleDelete(product.id)}
                              loading={deleteLoading === product.id}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 hidden sm:inline-flex"
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
        
        {/* Pagination */}
        {totalProducts > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex} a {endIndex} de {totalProducts} productos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                icon={<ChevronLeft size={16} />}
              >
                Anterior
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "primary" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                icon={<ChevronRight size={16} />}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categoryName={selectedProduct ? getCategoryName(selectedProduct.categoryId) : ''}
      />

      <ProductCatalogDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={handleCloseDownloadModal}
        onDownload={handleDownloadCatalog}
        isDownloading={isDownloading}
      />
    </div>
  );
}