import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Users, Download, Calendar, Filter, 
  DollarSign, ShoppingCart, AlertTriangle, BarChart3, PieChart,
  RefreshCw, FileText, TrendingDown, Clock, Award
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';

export default function Reports() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState('monthly');
  
  // Reports data
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [customerReport, setCustomerReport] = useState(null);

  const tabs = [
    { id: 'sales', label: 'Sales Reports', icon: TrendingUp },
    { id: 'inventory', label: 'Inventory Reports', icon: Package },
    { id: 'customers', label: 'Customer Reports', icon: Users }
  ];

  useEffect(() => {
    loadReports();
  }, [activeTab, startDate, endDate, period]);

  const loadReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        const data = await api.getSalesReport(startDate, endDate, period);
        setSalesReport(data);
      } else if (activeTab === 'inventory') {
        const data = await api.getInventoryReport();
        setInventoryReport(data);
      } else if (activeTab === 'customers') {
        const data = await api.getCustomerReport(startDate, endDate);
        setCustomerReport(data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDateRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm p-6 mb-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive business insights and data analysis
            </p>
          </div>
          
          <button
            onClick={loadReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : `${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      {(activeTab === 'sales' || activeTab === 'customers') && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm p-6 mb-6 mx-6 rounded-lg`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              <span className="font-medium">Date Range:</span>
            </div>
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            
            <span className="text-gray-500">to</span>
            
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />

            <div className="flex gap-2">
              <button onClick={() => setQuickDateRange(7)} className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Last 7 Days
              </button>
              <button onClick={() => setQuickDateRange(30)} className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Last 30 Days
              </button>
              <button onClick={() => setQuickDateRange(90)} className={`px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                Last 90 Days
              </button>
            </div>

            {activeTab === 'sales' && (
              <>
                <div className="border-l border-gray-300 dark:border-gray-600 h-8 mx-2"></div>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className={`px-3 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="animate-spin text-blue-600" size={48} />
          </div>
        ) : (
          <>
            {activeTab === 'sales' && salesReport && <SalesReports data={salesReport} isDark={isDark} exportToCSV={exportToCSV} COLORS={COLORS} />}
            {activeTab === 'inventory' && inventoryReport && <InventoryReports data={inventoryReport} isDark={isDark} exportToCSV={exportToCSV} COLORS={COLORS} />}
            {activeTab === 'customers' && customerReport && <CustomerReports data={customerReport} isDark={isDark} exportToCSV={exportToCSV} COLORS={COLORS} />}
          </>
        )}
      </div>
    </div>
  );
}

// Sales Reports Component
function SalesReports({ data, isDark, exportToCSV, COLORS }) {
  const { summary, category_analysis, top_medicines, payment_analysis, trends } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${summary.total_revenue.toLocaleString()}`}
          subtitle={`${summary.total_bills} bills`}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          icon={ShoppingCart}
          title="Total Sales"
          value={summary.total_sales}
          subtitle={`${summary.avg_items_per_bill.toFixed(1)} items/bill`}
          color="green"
          isDark={isDark}
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Bill Value"
          value={`₹${summary.avg_bill_value.toFixed(2)}`}
          subtitle="Per transaction"
          color="purple"
          isDark={isDark}
        />
        <StatCard
          icon={FileText}
          title="GST Collected"
          value={`₹${summary.total_gst.toLocaleString()}`}
          subtitle={`${summary.gst_percentage}% of subtotal`}
          color="orange"
          isDark={isDark}
        />
      </div>

      {/* Revenue Trends Chart */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Revenue Trends</h3>
          <button
            onClick={() => exportToCSV(trends, 'revenue_trends')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="label" stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category & Payment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Analysis */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Category-wise Sales</h3>
            <button
              onClick={() => exportToCSV(category_analysis, 'category_analysis')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={category_analysis}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="category" stroke={isDark ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="total_revenue" fill="#3b82f6" name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Mode Analysis */}
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Payment Mode Distribution</h3>
            <button
              onClick={() => exportToCSV(payment_analysis, 'payment_analysis')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={payment_analysis}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ payment_mode, percent }) => `${payment_mode}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_amount"
                nameKey="payment_mode"
              >
                {payment_analysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                  borderRadius: '0.5rem'
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Medicines */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Top 10 Best-Selling Medicines</h3>
          <button
            onClick={() => exportToCSV(top_medicines, 'top_medicines')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Medicine Name</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Quantity Sold</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Sales Count</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {top_medicines.map((med, index) => (
                <tr key={med.medicine_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    {index < 3 ? (
                      <Award size={20} className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'} />
                    ) : (
                      <span className="text-gray-500">#{index + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{med.medicine_name}</td>
                  <td className="px-4 py-3 text-right">{med.total_quantity}</td>
                  <td className="px-4 py-3 text-right">{med.sales_count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">₹{med.total_revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Inventory Reports Component
function InventoryReports({ data, isDark, exportToCSV, COLORS }) {
  const { summary, stock_valuation, expired_items, expiring_soon, low_stock_items, fast_moving, slow_moving, reorder_suggestions } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          title="Total Medicines"
          value={summary.total_medicines}
          subtitle={`₹${summary.total_stock_value.toLocaleString()} value`}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          icon={AlertTriangle}
          title="Low Stock Alerts"
          value={summary.low_stock_count}
          subtitle={`${summary.out_of_stock_count} out of stock`}
          color="orange"
          isDark={isDark}
        />
        <StatCard
          icon={Clock}
          title="Expiring Soon"
          value={summary.expiring_soon_count}
          subtitle={`${summary.expired_count} expired`}
          color="red"
          isDark={isDark}
        />
        <StatCard
          icon={TrendingUp}
          title="Fast Moving"
          value={summary.fast_moving_count}
          subtitle={`${summary.slow_moving_count} slow moving`}
          color="green"
          isDark={isDark}
        />
      </div>

      {/* Stock Valuation by Category */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Stock Valuation by Category</h3>
          <button
            onClick={() => exportToCSV(stock_valuation, 'stock_valuation')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stock_valuation}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="category" stroke={isDark ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={100} />
            <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                borderRadius: '0.5rem'
              }}
            />
            <Bar dataKey="total_value" fill="#10b981" name="Value (₹)" />
            <Bar dataKey="total_quantity" fill="#3b82f6" name="Quantity" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reorder Suggestions */}
      {reorder_suggestions.length > 0 && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="text-orange-500" />
              Reorder Suggestions
            </h3>
            <button
              onClick={() => exportToCSV(reorder_suggestions, 'reorder_suggestions')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Medicine Name</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Current Stock</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Reorder Level</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Shortage</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Suggested Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {reorder_suggestions.map((item) => (
                  <tr key={item.medicine_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">{item.reorder_level}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{item.shortage}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{item.suggested_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabs for Different Reports */}
      <InventoryDetailsTabs
        expired_items={expired_items}
        expiring_soon={expiring_soon}
        low_stock_items={low_stock_items}
        fast_moving={fast_moving}
        slow_moving={slow_moving}
        isDark={isDark}
        exportToCSV={exportToCSV}
      />
    </div>
  );
}

// Customer Reports Component
function CustomerReports({ data, isDark, exportToCSV, COLORS }) {
  const { summary, top_customers, new_customers, purchase_frequency } = data;
  const [rankingMode, setRankingMode] = useState('revenue');

  const frequencyLabelMap = {
    '1_purchase': '1 Purchase',
    '2-5_purchases': '2-5 Purchases',
    '6-10_purchases': '6-10 Purchases',
    '11+_purchases': '11+ Purchases'
  };

  const frequencyData = Object.entries(purchase_frequency || {}).map(([key, value]) => ({
    name: frequencyLabelMap[key] || key,
    value: value || 0
  }));

  const hasFrequencyData = frequencyData.some((item) => item.value > 0);

  const rankedTopCustomers = [...(top_customers || [])].sort((a, b) => {
    if (rankingMode === 'frequency') {
      return Number(b.bills_count || 0) - Number(a.bills_count || 0);
    }
    return Number(b.total_spent || 0) - Number(a.total_spent || 0);
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          title="Total Customers"
          value={summary.total_customers}
          subtitle={`${summary.new_customers} new`}
          color="blue"
          isDark={isDark}
        />
        <StatCard
          icon={ShoppingCart}
          title="Active Customers"
          value={summary.customers_with_purchases}
          subtitle={`${summary.retention_rate.toFixed(1)}% retention`}
          color="green"
          isDark={isDark}
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${summary.total_revenue.toLocaleString()}`}
          subtitle="From period"
          color="purple"
          isDark={isDark}
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Customer Value"
          value={`₹${summary.avg_customer_value.toFixed(2)}`}
          subtitle="Per customer"
          color="orange"
          isDark={isDark}
        />
      </div>

      {/* Purchase Frequency Distribution */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
        <h3 className="text-lg font-semibold mb-4">Purchase Frequency Distribution</h3>
        {hasFrequencyData ? (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <RePieChart>
                <Pie
                  data={frequencyData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {frequencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]}
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: '1px solid ' + (isDark ? '#374151' : '#e5e7eb'),
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend verticalAlign="bottom" height={40} />
              </RePieChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-gray-500">
            No purchase frequency data available for selected range.
          </div>
        )}
      </div>

      {/* Top Customers */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Top 20 Customers by {rankingMode === 'frequency' ? 'Purchase Frequency' : 'Revenue'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRankingMode('revenue')}
              className={`px-3 py-2 text-sm rounded-lg border ${
                rankingMode === 'revenue'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setRankingMode('frequency')}
              className={`px-3 py-2 text-sm rounded-lg border ${
                rankingMode === 'frequency'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : isDark
                  ? 'border-gray-600 hover:bg-gray-700'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              Frequency
            </button>
            <button
              onClick={() => exportToCSV(rankedTopCustomers, `top_customers_${rankingMode}`)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Frequency ranking uses number of bills in the selected date range.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Customer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Bills</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Total Spent</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Avg Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rankedTopCustomers.map((customer, index) => (
                <tr key={`${customer.customer_name}-${customer.customer_phone}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    {index < 3 ? (
                      <Award size={20} className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'} />
                    ) : (
                      <span className="text-gray-500">#{index + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{customer.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{customer.customer_phone}</td>
                  <td className="px-4 py-3 text-right">{customer.bills_count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">₹{Number(customer.total_spent || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{Number(customer.avg_bill_value || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Customers */}
      {new_customers.length > 0 && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">New Customers</h3>
            <button
              onClick={() => exportToCSV(new_customers, 'new_customers')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {new_customers.map((customer, index) => (
              <div key={index} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </div>
                </div>
                {customer.email !== 'N/A' && (
                  <div className="text-sm text-gray-500 mt-2">{customer.email}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  Joined: {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, title, value, subtitle, color, isDark }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}

function InventoryDetailsTabs({ expired_items, expiring_soon, low_stock_items, fast_moving, slow_moving, isDark, exportToCSV }) {
  const [activeTab, setActiveTab] = useState('expiring');

  const tabs = [
    { id: 'expiring', label: 'Expiring Soon', data: expiring_soon, color: 'orange' },
    { id: 'expired', label: 'Expired', data: expired_items, color: 'red' },
    { id: 'low', label: 'Low Stock', data: low_stock_items, color: 'yellow' },
    { id: 'fast', label: 'Fast Moving', data: fast_moving, color: 'green' },
    { id: 'slow', label: 'Slow Moving', data: slow_moving, color: 'gray' }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              {tab.label} ({tab.data.length})
            </button>
          ))}
        </div>
        <button
          onClick={() => exportToCSV(currentTab.data, currentTab.id)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        {currentTab.data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {currentTab.label.toLowerCase()} items found
          </div>
        ) : (
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Medicine Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Batch No</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Quantity</th>
                {activeTab === 'expiring' && <th className="px-4 py-3 text-right text-sm font-semibold">Days to Expiry</th>}
                {activeTab === 'expired' && <th className="px-4 py-3 text-right text-sm font-semibold">Days Expired</th>}
                {(activeTab === 'fast' || activeTab === 'slow') && <th className="px-4 py-3 text-right text-sm font-semibold">Turnover Ratio</th>}
                <th className="px-4 py-3 text-right text-sm font-semibold">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentTab.data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.batch_no || item.category || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  {activeTab === 'expiring' && (
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.days_to_expiry <= 7 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        item.days_to_expiry <= 15 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {item.days_to_expiry} days
                      </span>
                    </td>
                  )}
                  {activeTab === 'expired' && (
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{item.days_expired} days</td>
                  )}
                  {(activeTab === 'fast' || activeTab === 'slow') && (
                    <td className="px-4 py-3 text-right font-semibold">{item.turnover_ratio}</td>
                  )}
                  <td className="px-4 py-3 text-right text-green-600">₹{item.value?.toLocaleString() || item.value_loss?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
