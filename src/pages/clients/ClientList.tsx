import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, MapPin, Plus, Search, Trash, User } from 'lucide-react';
import { useClientStore } from '../../store/client-store';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';

export function ClientList() {
  const { clients, getClients, deleteClient, isLoading, error } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    getClients();
  }, [getClients]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        setDeleteLoading(id);
        setDeleteError(null);
        await deleteClient(id);
      } catch (error) {
        if (error instanceof Error) {
          setDeleteError(error.message);
        } else {
          setDeleteError('Error al eliminar el cliente');
        }
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.commercialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ruc.includes(searchTerm)
  );

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la información de tus clientes
          </p>
        </div>
        <Link to="/clients/new">
          <Button icon={<Plus size={18} />}>Nuevo Cliente</Button>
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Buscar por nombre o RUC..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
              <h3 className="mt-4 text-lg font-medium">No se encontraron clientes</h3>
              <p className="mt-1 text-muted-foreground">
                {searchTerm
                  ? 'No hay resultados para tu búsqueda'
                  : 'Comienza creando un nuevo cliente'}
              </p>
              {!searchTerm && (
                <Link to="/clients/new" className="mt-6 inline-block">
                  <Button icon={<Plus size={18} />}>Nuevo Cliente</Button>
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    RUC
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Provincia
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{client.commercialName}</div>
                        <div className="text-sm text-muted-foreground">{client.businessName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">{client.ruc}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-sm">{client.district}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={client.province === 'Lima' ? 'primary' : 'secondary'}>
                        {client.province}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/clients/edit/${client.id}`}>
                          <Button variant="ghost" size="sm" icon={<Edit size={16} />} />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash size={16} />}
                          onClick={() => handleDelete(client.id)}
                          loading={deleteLoading === client.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}