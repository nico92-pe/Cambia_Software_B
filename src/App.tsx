import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { UserList } from './pages/users/UserList';
import { UserForm } from './pages/users/UserForm';
import { ClientList } from './pages/clients/ClientList';
import { ClientForm } from './pages/clients/ClientForm';
import { ProductList } from './pages/products/ProductList';
import { ProductForm } from './pages/products/ProductForm';
import { CategoryList } from './pages/products/CategoryList';
import OrderList from './pages/orders/OrderList';
import { OrderForm } from './pages/orders/OrderForm';
import { OrderDetail } from './pages/orders/OrderDetail';
import { OrderEdit } from './pages/orders/OrderEdit';
import { useAuthStore } from './store/auth-store';

function App() {
  const { initialize } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route element={<AuthLayout />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* User management routes */}
          <Route path="/users" element={<UserList />} />
          <Route path="/users/new" element={<UserForm />} />
          <Route path="/users/edit/:id" element={<UserForm />} />
          
          {/* Client routes */}
          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/edit/:id" element={<ClientForm />} />
          
          {/* Product routes */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/edit/:id" element={<ProductForm />} />
          <Route path="/products/categories" element={<CategoryList />} />
          
          {/* Order routes */}
          <Route path="/orders" element={<OrderList />} />
          <Route path="/orders/new" element={<OrderForm />} />
          <Route path="/orders/edit/:id" element={<OrderForm />} />
        </Route>
      </Route>
      
      {/* Redirect to dashboard if logged in, otherwise to login */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App