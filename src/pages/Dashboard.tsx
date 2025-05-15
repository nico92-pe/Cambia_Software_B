import React from 'react';
import { User, Package, ShoppingCart, Users } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { useClientStore } from '../store/client-store';
import { useProductStore } from '../store/product-store';
import { useOrderStore } from '../store/order-store';

export function Dashboard() {
  const { user } = useAuthStore();
  const { clients } = useClientStore();
  const { products } = useProductStore();
  const { orders } = useOrderStore();
  
  const stats = [
    {
      title: 'Clientes',
      value: clients.length,
      icon: <Users size={24} className="text-blue-500" />,
      color: 'bg-blue-50',
    },
    {
      title: 'Productos',
      value: products.length,
      icon: <Package size={24} className="text-green-500" />,
      color: 'bg-green-50',
    },
    {
      title: 'Pedidos',
      value: orders.length,
      icon: <ShoppingCart size={24} className="text-orange-500" />,
      color: 'bg-orange-50',
    },
  ];
  
  return (
    <div>
      <header className="mb-8 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Bienvenido, {user?.fullName}</h1>
        <p className="text-muted-foreground mt-1">
          Panel de control de Import & Distribution SaaS
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.title}
            className={`${stat.color} rounded-lg p-6 shadow-sm transition-all hover:shadow-md animate-in fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="p-3 rounded-full bg-white shadow-sm">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <h2 className="card-title">Pedidos Recientes</h2>
            <p className="card-description">Los últimos pedidos registrados en el sistema</p>
          </div>
          <div className="card-content">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">Pedido #{order.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <div className="font-semibold">
                      S/ {order.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                No hay pedidos registrados
              </p>
            )}
          </div>
        </div>
        
        <div className="card animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h2 className="card-title">Clientes Recientes</h2>
            <p className="card-description">Los últimos clientes agregados al sistema</p>
          </div>
          <div className="card-content">
            {clients.length > 0 ? (
              <div className="space-y-4">
                {clients.slice(0, 3).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{client.commercialName}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.province}, {client.district}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      RUC: {client.ruc}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                No hay clientes registrados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}