import { create } from 'zustand';
import { Product, Category } from '../lib/types';
import { supabase } from '../lib/supabase';

// Helper function to map database row to Category type
const mapDbRowToCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to map database row to Product type
const mapDbRowToProduct = (row: any): Product => ({
  id: row.id,
  code: row.code,
  name: row.name,
  wholesalePrice: parseFloat(row.wholesale_price),
  retailPrice: parseFloat(row.retail_price),
  distributorPrice: parseFloat(row.distributor_price),
  unitsPerBox: row.units_per_box,
  categoryId: row.category_id,
  stock: row.stock,
  imageUrl: row.image_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to map Category type to database format
const mapCategoryToDbFormat = (category: Partial<Category>) => ({
  name: category.name,
});

// Helper function to map Product type to database format
const mapProductToDbFormat = (product: Partial<Product>) => ({
  code: product.code,
  name: product.name,
  wholesale_price: product.wholesalePrice,
  retail_price: product.retailPrice,
  distributor_price: product.distributorPrice,
  units_per_box: product.unitsPerBox,
  category_id: product.categoryId,
  stock: product.stock,
  image_url: product.imageUrl,
});

interface ProductState {
  products: Product[];
  categories: Category[];
  totalProducts: number;
  isLoading: boolean;
  fetchLoading: boolean;
  error: string | null;

  // Category operations
  getCategories: () => Promise<void>;
  createCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, name: string) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  // Product operations
  getProducts: (page?: number, pageSize?: number, searchTerm?: string, categoryFilter?: string) => Promise<void>;
  getAllProductsForCatalog: () => Promise<Array<Product & { categoryName: string }>>;
  getProductsByCategory: (categoryId: string) => Promise<Product[]>;
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  totalProducts: 0,
  isLoading: false,
  fetchLoading: false,
  error: null,
  
  // Category operations
  getCategories: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      const categories = data.map(mapDbRowToCategory);
      set({ categories, isLoading: false });
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
      const dbData = mapCategoryToDbFormat({ name });
      
      const { data, error } = await supabase
        .from('categories')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      const newCategory = mapDbRowToCategory(data);
      
      set(state => ({
        categories: [newCategory, ...state.categories],
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
      const dbData = mapCategoryToDbFormat({ name });
      
      const { data, error } = await supabase
        .from('categories')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedCategory = mapDbRowToCategory(data);
      
      set(state => ({
        categories: state.categories.map(category => 
          category.id === id ? updatedCategory : category
        ),
        isLoading: false
      }));
      
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
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
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
  getProducts: async (page = 1, pageSize = 10, searchTerm = '', categoryFilter = '') => {
    const isInitialLoad = get().products.length === 0;

    if (isInitialLoad) {
      set({ isLoading: true, error: null });
    } else {
      set({ fetchLoading: true, error: null });
    }

    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .range(from, to)
        .order('category_id', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const products = data.map(mapDbRowToProduct);

      set({
        products,
        totalProducts: count || 0,
        isLoading: false,
        fetchLoading: false
      });
    } catch (error) {
      set({
        isLoading: false,
        fetchLoading: false,
        error: error instanceof Error ? error.message : 'Error al cargar productos'
      });
    }
  },
  
  searchProductsForOrderForm: async (searchTerm = '', categoryFilter = '') => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `);
      
      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
      }
      
      // Apply category filter
      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(1000); // Reasonable limit to prevent performance issues
      
      if (error) throw error;
      
      const products = data.map(mapDbRowToProduct);
      
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },
  
  getAllProductsForCatalog: async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('category_id', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const productsWithCategory = data.map(row => ({
        ...mapDbRowToProduct(row),
        categoryName: row.category?.name || 'Sin Categoría'
      }));

      return productsWithCategory;
    } catch (error) {
      console.error('Error loading products for catalog:', error);
      throw error;
    }
  },

  getProductsByCategory: async (categoryId) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const products = data.map(mapDbRowToProduct);
      set({ isLoading: false });

      return products;
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
      const dbData = mapProductToDbFormat(productData);
      
      const { data, error } = await supabase
        .from('products')
        .insert(dbData)
        .select()
        .single();
        
      if (error) throw error;
      
      const newProduct = mapDbRowToProduct(data);
      
      set(state => ({
        products: [newProduct, ...state.products],
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
      const dbData = mapProductToDbFormat(productData);
      
      const { data, error } = await supabase
        .from('products')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      const updatedProduct = mapDbRowToProduct(data);
      
      set(state => ({
        products: state.products.map(product => 
          product.id === id ? updatedProduct : product
        ),
        isLoading: false
      }));
      
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
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
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