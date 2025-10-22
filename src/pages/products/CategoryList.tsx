import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Edit, Plus, Tag, Trash } from 'lucide-react';
import { useProductStore } from '../../store/product-store';
import { useAuthStore } from '../../store/auth-store';
import { UserRole } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { supabase } from '../../lib/supabase';

export function CategoryList() {
  const navigate = useNavigate();
  const { categories, getCategories, createCategory, updateCategory, deleteCategory, reorderCategories, isLoading, error } = useProductStore();
  const { user } = useAuthStore();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAsesorVentas = user?.role === UserRole.ASESOR_VENTAS;

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      await createCategory(newCategoryName);
      setNewCategoryName('');
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError('Error al crear la categoría');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategoryId || !editCategoryName.trim()) return;

    try {
      setActionLoading(true);
      setActionError(null);
      await updateCategory(editCategoryId, editCategoryName);
      setEditCategoryId(null);
      setEditCategoryName('');
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError('Error al actualizar la categoría');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta categoría?')) {
      try {
        setActionLoading(true);
        setActionError(null);
        await deleteCategory(id);
      } catch (error) {
        if (error instanceof Error) {
          setActionError(error.message);
        } else {
          setActionError('Error al eliminar la categoría');
        }
      } finally {
        setActionLoading(false);
      }
    }
  };

  const startEdit = (category: { id: string; name: string }) => {
    setEditCategoryId(category.id);
    setEditCategoryName(category.name);
  };

  const cancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName('');
  };

  const handleMoveUp = async (categoryId: string, currentOrder: number) => {
    if (currentOrder <= 1) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const targetCategory = categories.find(c => c.displayOrder === currentOrder - 1);
      if (!targetCategory) return;

      await supabase.from('categories').update({ display_order: currentOrder }).eq('id', targetCategory.id);
      await reorderCategories(categoryId, currentOrder - 1);
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError('Error al reordenar categorías');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveDown = async (categoryId: string, currentOrder: number) => {
    if (currentOrder >= categories.length) return;

    try {
      setActionLoading(true);
      setActionError(null);

      const targetCategory = categories.find(c => c.displayOrder === currentOrder + 1);
      if (!targetCategory) return;

      await supabase.from('categories').update({ display_order: currentOrder }).eq('id', targetCategory.id);
      await reorderCategories(categoryId, currentOrder + 1);
    } catch (error) {
      if (error instanceof Error) {
        setActionError(error.message);
      } else {
        setActionError('Error al reordenar categorías');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las categorías de productos
          </p>
        </div>
        <Button
          variant="outline"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/products')}
        >
          Volver a Productos
        </Button>
      </header>

      {(error || actionError) && (
        <Alert variant="destructive" className="mb-6 animate-in fade-in duration-300">
          {error || actionError}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!isAsesorVentas && (
          <div className="card animate-in fade-in duration-500">
            <div className="card-header">
              <h2 className="card-title text-xl">Nueva Categoría</h2>
              <p className="card-description">
                Añade una nueva categoría para tus productos
              </p>
            </div>
            <div className="card-content">
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newCategory" className="block text-sm font-medium">
                    Nombre de la Categoría
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Tag size={18} />
                    </div>
                    <input
                      id="newCategory"
                      type="text"
                      className="input pl-10"
                      placeholder="Nombre de la categoría"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  icon={<Plus size={18} />}
                  loading={actionLoading}
                  disabled={!newCategoryName.trim()}
                >
                  Crear Categoría
                </Button>
              </form>
            </div>
          </div>
        )}

        <div className={`card animate-in fade-in duration-500 ${isAsesorVentas ? 'md:col-span-2' : ''}`} style={{ animationDelay: '100ms' }}>
          <div className="card-header">
            <h2 className="card-title text-xl">
              {isAsesorVentas ? 'Categorías' : 'Categorías Existentes'}
            </h2>
            <p className="card-description">
              {isAsesorVentas ? 'Visualiza las categorías del catálogo' : 'Administra las categorías de tu catálogo'}
            </p>
          </div>
          <div className="card-content">
            {categories.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
                <h3 className="mt-4 text-lg font-medium">No hay categorías</h3>
                <p className="mt-1 text-muted-foreground">
                  Crea una categoría para empezar
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {categories.map((category) => (
                  <li key={category.id} className="bg-gray-50 rounded-md p-3">
                    {editCategoryId === category.id ? (
                      <form onSubmit={handleEditCategory} className="flex gap-2">
                        <input
                          type="text"
                          className="input flex-1"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          required
                        />
                        <Button
                          type="submit"
                          size="sm"
                          loading={actionLoading}
                          disabled={!editCategoryName.trim()}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </Button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        {!isAsesorVentas && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<ArrowUp size={16} />}
                              onClick={() => handleMoveUp(category.id, category.displayOrder)}
                              disabled={category.displayOrder === 1 || actionLoading}
                              title="Mover arriba"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<ArrowDown size={16} />}
                              onClick={() => handleMoveDown(category.id, category.displayOrder)}
                              disabled={category.displayOrder === categories.length || actionLoading}
                              title="Mover abajo"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit size={16} />}
                              onClick={() => startEdit(category)}
                              title="Editar"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash size={16} />}
                              onClick={() => handleDeleteCategory(category.id)}
                              loading={actionLoading}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Eliminar"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="text-center">
                <Loader />
                <p className="text-muted-foreground mt-2">Cargando categorías...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}