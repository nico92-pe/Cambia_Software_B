import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronDown,
  Home, 
  LogOut, 
  Menu, 
  Package, 
  ShoppingCart, 
  User, 
  Users,
  UserPlus,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { cn } from '../../lib/utils';
import { UserRole } from '../../lib/types';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

export function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { icon: <Home size={20} />, label: 'Inicio', path: '/dashboard' },
    { icon: <User size={20} />, label: 'Perfil', path: '/profile' },
    { icon: <Users size={20} />, label: 'Clientes', path: '/clients' },
    { icon: <Package size={20} />, label: 'Productos', path: '/products' },
    { icon: <ShoppingCart size={20} />, label: 'Pedidos', path: '/orders' },
  ];

  // Add Users management for Super Admin only
  if (user?.role === UserRole.SUPER_ADMIN) {
    navItems.push({ icon: <UserPlus size={20} />, label: 'Usuarios', path: '/users' });
  }
  
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="font-bold text-xl text-primary">Cambia</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              <X size={20} />
            </Button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <Menu size={20} />
            </Button>
            
            <div className="relative ml-auto">
              <Button 
                variant="ghost" 
                className="flex items-center gap-2" 
                onClick={toggleProfileMenu}
              >
                <Avatar name={user?.fullName} size="sm" />
                <span className="hidden md:block font-medium">{user?.fullName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 animate-in fade-in slide-in-right">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <NavLink
                      to="/profile"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <User size={18} />
                      <span>Mi Perfil</span>
                    </NavLink>
                    <button
                      className="w-full flex items-center gap-2 p-2 rounded-md text-destructive hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}