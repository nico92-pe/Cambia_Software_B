import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Tag, Package, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useProductStore } from '../store/product-store';
import { Product } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { Badge } from '../components/ui/Badge';

export function PublicProductCatalog() {
  const { products, categories, totalProducts, getProducts, getCategories, isLoading } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const PRODUCTS_PER_PAGE = 12;
  
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

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  useEffect(() => {
    getProducts(currentPage, PRODUCTS_PER_PAGE, searchTerm, categoryFilter);
  }, [getProducts, currentPage, searchTerm, categoryFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/Logo Cambia - SVG.svg" 
                alt="Cambia" 
                className="h-12 w-auto"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" icon={<Home size={18} />}>
                  Inicio
                </Button>
              </Link>
              <Link to="/login">
                <Button>Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="outline" icon={<ArrowLeft size={18} />}>
                Volver al Inicio
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
          <p className="text-xl text-gray-600">
            Descubre nuestra amplia gama de griferías y accesorios de calidad premium
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar productos
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                Categoría
              </label>
              <select
                value={categoryFilter}
                onChange={handleCategoryFilter}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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

        {/* Products Grid */}
        <div className="animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader size="lg" />
                <p className="text-gray-600 mt-4">Cargando productos...</p>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-gray-400 opacity-50" />
              <h3 className="mt-4 text-xl font-medium text-gray-900">No se encontraron productos</h3>
              <p className="mt-2 text-gray-600">
                {searchTerm || categoryFilter
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'Nuestro catálogo se está actualizando'}
              </p>
            </div>
          ) : (
            <>
              {/* Results Info */}
              {totalProducts > 0 && (
                <div className="mb-6 text-gray-600">
                  Mostrando {startIndex} a {endIndex} de {totalProducts} productos
                </div>
              )}

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product, index) => (
                  <div 
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-in fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryName(product.categoryId)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Código: {product.code}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {product.unitsPerBox} unidades/caja
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalProducts > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
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
                            className="w-10 h-10 p-0"
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
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" 
              alt="Griferías Cambia" 
              className="h-8 w-8 rounded-full mr-2"
            />
            <h3 className="text-xl font-bold">Griferías Cambia</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Especialistas en griferías y accesorios de calidad premium para tu hogar.
          </p>
          <div className="text-sm text-gray-500">
            <p>&copy; 2024 Griferías Cambia. Todos los derechos reservados.</p>
            <p className="mt-2">Av. José Bernardo Alcedo 525, San Martín de Porres, Lima, Perú</p>
          </div>
        </div>
      </footer>
    </div>
  );
}