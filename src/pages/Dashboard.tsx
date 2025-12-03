import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Users, Package } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { useOrderStore } from '../store/order-store';
import { UserRole } from '../lib/types';
import { Loader } from '../components/ui/Loader';
import { formatCurrency } from '../lib/utils';

export function Dashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { salesDashboardData, salesStats, getSalesDashboardData, isLoading: ordersLoading } = useOrderStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);

  const isLoading = authLoading || ordersLoading;
  const isAsesorVentas = user?.role === UserRole.ASESOR_VENTAS;

  useEffect(() => {
    if (user) {
      getSalesDashboardData(selectedYear, selectedMonth);
    }
  }, [user, selectedYear, selectedMonth, getSalesDashboardData]);

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Month options
  const monthOptions = [
    { value: null, label: 'Todos los meses' },
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];
  
  // Prepare data for charts
  const chartData = salesStats?.salesByMonth.map(monthData => {
    const chartItem: any = {
      month: monthData.monthLabel,
      total: monthData.total,
    };
    
    // Add status breakdown
    Object.entries(monthData.byStatus).forEach(([status, total]) => {
      const statusLabels = {
        borrador: 'Borrador',
        tomado: 'Tomado',
        confirmado: 'Confirmado',
        en_preparacion: 'En Preparación',
        despachado: 'Despachado',
      };
      chartItem[statusLabels[status as keyof typeof statusLabels] || status] = total;
    });
    
    // Add salesperson breakdown (only for admin/super_admin)
    if (!isAsesorVentas) {
      Object.entries(monthData.bySalesperson).forEach(([salesperson, total]) => {
        chartItem[salesperson] = total;
      });
    }
    
    return chartItem;
  }) || [];
  
  // Colors for different chart elements
  const statusColors = {
    'Borrador': '#6B7280',
    'Tomado': '#F59E0B',
    'Confirmado': '#3B82F6',
    'En Preparación': '#8B5CF6',
    'Despachado': '#10B981',
  };
  
  const salespersonColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
  ];
  
  // Get unique salespeople for the chart
  const uniqueSalespeople = Array.from(
    new Set(salesStats?.salesBySalesperson.map(s => s.salespersonName) || [])
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader size="lg" />
          <p className="text-muted-foreground mt-4">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold">Dashboard de Ventas</h1>
        <p className="text-muted-foreground mt-1">
          Análisis de ventas y estadísticas del sistema
        </p>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-5 w-5" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 flex-1">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Mes:</label>
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {monthOptions.map((month) => (
                  <option key={month.label} value={month.value || ''}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '200ms' }}>
          <div>
            <p className="text-xs font-medium text-gray-600">Ventas Totales con IGV</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              S/ {(salesStats?.totalSales || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '250ms' }}>
          <div>
            <p className="text-xs font-medium text-gray-600">Total Pedidos</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {salesStats?.totalOrders || 0}
            </p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
          <div>
            <p className="text-xs font-medium text-gray-600">Promedio por Pedido</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              S/ {salesStats?.totalOrders ? ((salesStats.totalSales / salesStats.totalOrders)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
        </div>
        
        {!isAsesorVentas && (
          <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '350ms' }}>
            <div>
              <p className="text-xs font-medium text-gray-600">Vendedores Activos</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {salesStats?.salesBySalesperson.length || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Sales by Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '400ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Ventas por Estado</h2>
            <p className="text-gray-600">Distribución de ventas por mes según el estado del pedido</p>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                {Object.entries(statusColors).map(([status, color]) => (
                  <Bar 
                    key={status}
                    dataKey={status} 
                    stackId="status"
                    fill={color}
                    name={status}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Salesperson Chart - Only for Admin/Super_Admin */}
        {!isAsesorVentas && (
          <div className="bg-white p-6 rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '500ms' }}>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ventas por Vendedor</h2>
              <p className="text-gray-600">Distribución de ventas por mes según el vendedor</p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  {uniqueSalespeople.map((salesperson, index) => (
                    <Bar 
                      key={salesperson}
                      dataKey={salesperson} 
                      stackId="salesperson"
                      fill={salespersonColors[index % salespersonColors.length]}
                      name={salesperson}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Status Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '600ms' }}>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Resumen por Estado</h2>
          <p className="text-gray-600">Detalle de pedidos y ventas por estado</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad de Pedidos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total de Ventas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio por Pedido
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesStats?.salesByStatus.map((statusData) => (
                <tr key={statusData.status} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: statusColors[statusData.statusLabel as keyof typeof statusColors] }}
                      />
                      <span className="font-medium text-gray-900">{statusData.statusLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                    {statusData.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {formatCurrency(statusData.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {formatCurrency(statusData.count > 0 ? statusData.total / statusData.count : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salesperson Breakdown Table - Only for Admin/Super_Admin */}
      {!isAsesorVentas && (
        <div className="bg-white rounded-lg shadow-sm border animate-in fade-in duration-500" style={{ animationDelay: '700ms' }}>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Resumen por Vendedor</h2>
            <p className="text-gray-600">Detalle de pedidos y ventas por vendedor</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad de Pedidos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total de Ventas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Promedio por Pedido
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesStats?.salesBySalesperson.map((salespersonData, index) => (
                  <tr key={salespersonData.salespersonId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: salespersonColors[index % salespersonColors.length] }}
                        />
                        <span className="font-medium text-gray-900">{salespersonData.salespersonName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-medium">
                      {salespersonData.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {formatCurrency(salespersonData.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {formatCurrency(salespersonData.count > 0 ? salespersonData.total / salespersonData.count : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}