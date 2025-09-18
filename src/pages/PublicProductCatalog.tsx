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
            <svg 
              className="h-8 w-auto" 
              viewBox="0 0 322.72 113.36" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>
                {`.st0{fill:#5D7F98;}.st1{fill:#00A2E1;}.st2{fill:#FFFFFF;}`}
              </style>
              <g>
                <path className="st0" d="M96.97,73.43c-3.98-2.41-9.24-1.66-11.76,2.15c-0.25,0.38-0.44,0.58-0.62,0.99c0,0-0.19,0.37-0.29,0.62
                  c-3.19,7.74-14.9,14.67-26.13,14.67c-17.28,0-31.34-15.79-31.34-35.15c0-19.36,14.06-35.13,31.34-35.13
                  c11.04,0,22.19,6.49,26.07,13.85c0.45,1.02,2.21,5.46,7.74,5.63c4.46,0,8.08-3.47,8.08-7.75c0-1.2-0.31-2.33-0.82-3.35l0.02-0.01
                  C92.66,17.15,74.64,6.33,58.18,6.33c-26.06,0-47.25,22.58-47.25,50.34c0,27.77,21.2,50.35,47.25,50.35
                  c17.31,0,34.35-10.7,41.34-22.98C101.59,80.02,100.48,75.55,96.97,73.43"/>
                <g>
                  <path className="st1" d="M94.26,46.97c0.26,0.24,0.56,0.46,0.79,0.73c2.54,2.88,4.55,5.99,5.89,9.40c0.74,1.89,0.86,3.81,0.19,5.73
                    c-0.5,1.44-1.45,2.57-3.18,3.13c-1.04,0.34-2.14,0.39-3.24,0.27c-1.3-0.13-2.52-0.48-3.44-1.3c-1.83-1.65-2.25-3.61-1.44-5.7
                    c0.43-1.11,1.14-2.15,1.83-3.18c1.67-2.5,2.77-5.12,2.57-8.04c-0.02-0.32-0.05-0.64-0.07-0.97
                    C94.19,47.01,94.22,46.99,94.26,46.97"/>
                  <path className="st2" d="M97.74,58.21c0.07,0.06,0.15,0.12,0.21,0.19c0.68,0.77,1.21,1.6,1.57,2.5c0.2,0.5,0.23,1.01,0.05,1.53
                    c-0.13,0.38-0.39,0.68-0.85,0.83c-0.28,0.09-0.57,0.1-0.86,0.07c-0.35-0.04-0.67-0.13-0.92-0.35c-0.49-0.44-0.6-0.96-0.38-1.52
                    c0.12-0.3,0.31-0.57,0.49-0.85c0.44-0.67,0.74-1.37,0.69-2.14c-0.01-0.08-0.01-0.17-0.02-0.26
                    C97.72,58.22,97.73,58.22,97.74,58.21"/>
                </g>
                <path className="st1" d="M59.54,74.38c-8.74,0-15.85-7.94-15.85-17.7c0-9.76,7.11-17.7,15.85-17.7c5.49,0,11.31,3.33,13.54,7.74
                  l0.35,0.75c0.22,0.48,0.19,1.04-0.1,1.48c-0.28,0.45-0.77,0.72-1.3,0.72H71c-0.54,0-1.04-0.28-1.32-0.75l-0.14-0.24
                  c-1.44-2.83-5.54-5.67-9.99-5.67c-6.51,0-11.81,6.13-11.81,13.66c0,7.53,5.3,13.66,11.81,13.66c4.37,0,8.55-2.83,10.05-5.57
                  c0.01-0.02,0.02-0.03,0.03-0.05l0.14-0.24c0.28-0.47,0.78-0.75,1.32-0.75h1.09c0.54,0,1.05,0.28,1.32,0.75
                  c0.28,0.47,0.29,1.04,0.04,1.52l-0.38,0.71C70.96,70.55,65.59,74.38,59.54,74.38"/>
                <path className="st1" d="M142.07,74.38h-1.05c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                  c-0.21,0.63-0.8,1.05-1.47,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.29-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                  c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C143.07,74.12,142.59,74.38,142.07,74.38"/>
                <path className="st1" d="M191.25,74.38h-0.95c-0.85,0-1.54-0.69-1.54-1.54l-0.04-22.53l-10.37,22.88c-0.3,0.69-1.02,1.16-1.83,1.16
                  c-0.81,0-1.54-0.47-1.85-1.19l-10.39-22.85v22.53c0,0.85-0.69,1.54-1.54,1.54h-0.95c-0.85,0-1.55-0.69-1.55-1.54V41
                  c0-0.94,0.66-1.74,1.6-1.94c0.94-0.2,1.87,0.26,2.26,1.13l12.42,27.31l12.38-27.32c0.38-0.85,1.31-1.31,2.25-1.12
                  c0.94,0.2,1.6,1,1.6,1.94l0.05,31.84C192.79,73.69,192.1,74.38,191.25,74.38"/>
                <path className="st1" d="M229.3,73.91h-13.35c-1.13,0-2.02-0.89-2.02-2.02l0.02-14.52c-0.02-0.11-0.03-0.22-0.02-0.34l0.02-0.45
                  l0.02-15.06c0-1.13,0.89-2.02,2.02-2.02l11.35-0.05c5.84,0,10.58,4.32,10.58,9.62c0,2.65-1.22,5.15-3.26,6.94
                  c3.12,1.71,5.16,4.83,5.16,8.27C239.83,69.59,235.11,73.91,229.3,73.91 M218,58.7l0.02,11.21l11.28-0.04
                  c3.58,0,6.49-2.51,6.49-5.58c0-3.08-2.91-5.58-6.49-5.58H218z M217.97,43.49l0.02,11.21l9.36-0.04c3.61,0,6.54-2.51,6.54-5.58
                  c0-3.08-2.93-5.59-6.53-5.59H217.97z"/>
                <path className="st1" d="M261.13,74.38h-0.95c-0.85,0-1.55-0.69-1.55-1.54V40.52c0-0.85,0.69-1.54,1.55-1.54h0.95
                  c0.85,0,1.54,0.69,1.54,1.54v32.32C262.68,73.69,261.99,74.38,261.13,74.38"/>
                <path className="st1" d="M310.25,74.38h-1.04c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                  c-0.21,0.63-0.8,1.05-1.46,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.28-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                  c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C311.26,74.12,310.77,74.38,310.25,74.38"/>
              </g>
            </svg>
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