import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Plus, Search, Trash, UserPlus, Users } from 'lucide-react';
import { useUserStore } from '../../store/user-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { UserRole } from '../../lib/types';

export function UserList() {
  const { users, getUsers, deleteUser, isLoading, error } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        setDeleteLoading(id);
        setDeleteError(null);
        await deleteUser(id);
      } catch (error) {
        if (error instanceof Error) {
          setDeleteError(error.message);
        } else {
          setDeleteError('Error al eliminar el usuario');
        }
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Badge variant="primary">Super Admin</Badge>;
      case 'admin':
        return <Badge variant="secondary">Administrador</Badge>;
      case 'asesor_ventas':
        return <Badge variant="success">Asesor de Ventas</Badge>;
      default:
        return <Badge>Usuario</Badge>;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Link to="/users/new">
          <Button icon={<UserPlus size={18} />}>Nuevo Usuario</Button>
        </Link>
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

      <div className="card animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="card-header border-b">
          <div className="relative mb-4 sm:mb-0">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Buscar por nombre, email o cargo..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No se encontraron usuarios</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm
                  ? 'No hay resultados para tu búsqueda'
                  : 'Comienza creando un nuevo usuario'}
              </p>
              {!searchTerm && (
                <Link to="/users/new" className="mt-6 inline-block">
                  <Button icon={<Plus size={18} />}>Nuevo Usuario</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
            <div className="block sm:hidden">
              {/* Mobile Card View */}
              <div className="space-y-4 p-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <div className="flex items-center">
                        <Avatar name={user.fullName} size="sm" className="mr-3" />
                        <div>
                          <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cargo:</span>
                        <span className="font-medium">{user.cargo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rol:</span>
                        {getRoleBadge(user.role)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teléfono:</span>
                        <span>{user.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100">
                      <Link to={`/users/edit/${user.id}`}>
                        <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash size={16} />}
                        onClick={() => handleDelete(user.id)}
                        loading={deleteLoading === user.id}
                        disabled={user.role === UserRole.SUPER_ADMIN}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
              <thead className="bg-muted hidden sm:table-header-group">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cargo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contacto
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 hidden sm:table-row-group">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar name={user.fullName} size="sm" className="mr-3" />
                        <div>
                          <div className="font-medium">{user.fullName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{user.cargo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/users/edit/${user.id}`}>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />} className="hidden sm:inline-flex" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash size={16} />}
                          onClick={() => handleDelete(user.id)}
                          loading={deleteLoading === user.id}
                          disabled={user.role === UserRole.SUPER_ADMIN}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 hidden sm:inline-flex"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}