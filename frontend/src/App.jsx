import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, TrendingUp, LogOut, Moon, Sun, Receipt, BarChart3, Truck, ClipboardList } from 'lucide-react';

import Dashboard from './components/Dashboard';
import { useTheme } from './contexts/ThemeContext';
import Stock from './components/Stock';
import Customers from './components/Customers';
import Predictions from './components/Predictions';
import Billing from './components/Billing';
import Auth from './components/Auth';
import ChatBot from './components/ChatBot';
import Reports from './components/Reports';
import NotificationCenter from './components/NotificationCenter';
import Suppliers from './components/Suppliers';
import PurchaseOrders from './components/PurchaseOrders';

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    // Only set user if both token and savedUser exist and are valid
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Verify that the parsed user has required fields
        if (parsedUser && parsedUser.email && parsedUser.full_name) {
          setUser(parsedUser);
        } else {
          // Invalid user data, clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Invalid JSON, clear localStorage
        console.error('Invalid user data in localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'}`}>
      
      {/* HEADER */}
      <header className={`glass sticky top-0 z-50 shadow-lg backdrop-blur-xl border-b ${isDark ? 'border-gray-700/50' : 'border-white/40'}`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                Smart Pharmacy
              </h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Welcome back, <span className="font-semibold">{user.full_name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110 ${
                isDark 
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-gray-900 hover:shadow-yellow-500/50' 
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:shadow-purple-500/50'
              }`}
              aria-label="Toggle dark/bright mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className={`glass sticky top-[88px] z-40 shadow-md border-b ${isDark ? 'border-gray-700/50' : 'border-white/40'}`}>
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-3 transition-all duration-300 whitespace-nowrap font-medium ${
                  activeTab === tab.id
                    ? 'border-b-4 border-blue-600 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/30 dark:border-blue-400 text-blue-600 dark:text-blue-400 transform scale-105'
                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="p-6 animate-fadeIn">
        <div className="max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              onBillCreated={() => {
                sessionStorage.setItem('billingToast', 'dashboard-bill-created');
                setActiveTab('billing');
              }}
            />
          )}
          {activeTab === 'stock' && <Stock />}
          {activeTab === 'customers' && <Customers />}
          {activeTab === 'billing' && <Billing />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'suppliers' && <Suppliers />}
          {activeTab === 'purchase-orders' && <PurchaseOrders />}
          {activeTab === 'predictions' && <Predictions />}
        </div>
      </main>

      {/* CHATBOT - Floating Widget */}
      <ChatBot />

    </div>
  );
}
