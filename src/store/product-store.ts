import { create } from 'zustand';
import { Product, Category } from '../lib/types';
import { delay } from '../lib/utils';

// Mock initial data
const INITIAL_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Electrónicos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Hogar',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    code: 'E001',
    name: 'Televisor Smart 55"',
    wholesalePrice: 1500,
    retailPrice: 2000,
    distributorPrice: 1700,
    creditPrice: 2200,
    cashPrice: 1900,
    unitsPerBox: 1,
    categoryId: '1',
    stock: 25,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    code: 'H001',
    name: 'Juego de Ollas Premium',
    wholesalePrice: 300,
    retailPrice: 450,
    distributorPrice: 350,
    creditPrice: 500,
    cashPrice: 400,
    unitsPerBox: 4,
    categoryId: '2',
    stock: 40,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface ProductState {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // Category operations
  getCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Product operations
  getProducts: () => Promise<void>;
  getProductsByCategory: (categoryId: string) => Promise<Product[]>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: INITIAL_PRODUCTS,
  categories: INITIAL_CATEGORIES,
  isLoading: false,
  error: null,
  
  // Category operations
  getCategories: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      // In a real app, we would fetch from an API
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar categorías'
      });
    }
  },
  
  createCategory: async (name) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        categories: [...state.categories, newCategory],
        isLoading: false
      }));
      
      return newCategory;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear categoría'
      });
      throw error;
    }
  },
  
  updateCategory: async (id, name) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      
      let updatedCategory: Category | undefined;
      
      set(state => {
        const updatedCategories = state.categories.map(category => {
          if (category.id === id) {
            updatedCategory = {
              ...category,
              name,
              updatedAt: new Date().toISOString()
            };
            return updatedCategory;
          }
          return category;
        });
        
        return {
          categories: updatedCategories,
          isLoading: false
        };
      });
      
      if (!updatedCategory) {
        throw new Error('Categoría no encontrada');
      }
      
      return updatedCategory;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar categoría'
      });
      throw error;
    }
  },
  
  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      
      // Check if category has products
      const hasProducts = get().products.some(product => product.categoryId === id);
      
      if (hasProducts) {
        throw new Error('No se puede eliminar una categoría que tiene productos asociados');
      }
      
      set(state => ({
        categories: state.categories.filter(category => category.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar categoría'
      });
      throw error;
    }
  },
  
  // Product operations
  getProducts: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(800);
      // In a real app, we would fetch from an API
      
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar productos'
      });
    }
  },
  
  getProductsByCategory: async (categoryId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(500);
      
      const filteredProducts = get().products.filter(p => p.categoryId === categoryId);
      set({ isLoading: false });
      
      return filteredProducts;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al buscar productos'
      });
      return [];
    }
  },
  
  createProduct: async (productData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      set(state => ({
        products: [...state.products, newProduct],
        isLoading: false
      }));
      
      return newProduct;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al crear producto'
      });
      throw error;
    }
  },
  
  updateProduct: async (id, productData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      let updatedProduct: Product | undefined;
      
      set(state => {
        const updatedProducts = state.products.map(product => {
          if (product.id === id) {
            updatedProduct = {
              ...product,
              ...productData,
              updatedAt: new Date().toISOString()
            };
            return updatedProduct;
          }
          return product;
        });
        
        return {
          products: updatedProducts,
          isLoading: false
        };
      });
      
      if (!updatedProduct) {
        throw new Error('Producto no encontrado');
      }
      
      return updatedProduct;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar producto'
      });
      throw error;
    }
  },
  
  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate API call
      await delay(1000);
      
      set(state => ({
        products: state.products.filter(product => product.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar producto'
      });
      throw error;
    }
  }
}));