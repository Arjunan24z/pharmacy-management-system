import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  X,
  Calendar
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { MEDICINE_CATEGORIES } from '../constants/medicine';

export default function Stock() {
  const { isDark } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    expired: 0,
    categories: []
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const data = await api.getMedicines();
      setMedicines(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading medicines:', error);
    }
  };

  const calculateStats = (data) => {
    const categories = [...new Set(data.map(m => m.category))];
    const lowStock = data.filter(m => m.quantity <= m.reorder_level).length;
    const expired = data.filter(m => new Date(m.expiry_date) < new Date()).length;
    
    setStats({
      total: data.length,
      lowStock,
      expired,
      categories
    });
  };

  const getStatus = (medicine) => {
    const expiryDate = new Date(medicine.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (expiryDate < today) {
      return { label: 'Expired', color: 'red', icon: AlertCircle };
    } else if (medicine.quantity <= medicine.reorder_level) {
      return { label: 'Low Stock', color: 'orange', icon: TrendingDown };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', color: 'yellow', icon: Clock };
    } else {
      return { label: 'In Stock', color: 'green', icon: CheckCircle };
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await api.deleteMedicine(id);
        alert('✅ Medicine deleted successfully!');
        loadMedicines();
      } catch (error) {
        alert('❌ Error deleting medicine: ' + error.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your medicine stock efficiently</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Medicine
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          icon={<Package size={24} />}
          title="Total Medicines"
          value={stats.total}
          gradient="from-blue-500 to-cyan-500"
          isDark={isDark}
        />
        <StatsCard
          icon={<TrendingDown size={24} />}
          title="Low Stock"
          value={stats.lowStock}
          gradient="from-orange-500 to-red-500"
          isDark={isDark}
        />
        <StatsCard
          icon={<AlertCircle size={24} />}
          title="Expired"
          value={stats.expired}
          color="red"
          isDark={isDark}
        />
        <StatsCard
          icon={<Filter size={24} />}
          title="Categories"
          value={stats.categories.length}
          gradient="from-purple-500 to-pink-500"
          isDark={isDark}
        />
      </div>

      {/* Search and Filter */}
      <div className="glass p-6 rounded-2xl shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by medicine name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all outline-none ${
                isDark ? 'bg-gray-700/50 border-gray-600 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20' : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
              }`}
            >
              <option value="All">All Categories</option>
              {stats.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Expiry Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((medicine) => {
                  const status = getStatus(medicine);
                  const StatusIcon = status.icon;
                  return (
                    <tr 
                      key={medicine._id}
                      className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                          #{medicine._id.slice(-6)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{medicine.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{medicine.manufacturer}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {medicine.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ₹{medicine.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            medicine.quantity <= medicine.reorder_level
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {medicine.quantity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            / {medicine.reorder_level}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(medicine.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          status.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          status.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedMedicine(medicine);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(medicine._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No medicines found</p>
                    <p className="text-sm">Try adjusting your search or filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <MedicineModal
          isDark={isDark}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadMedicines();
          }}
        />
      )}

      {showEditModal && selectedMedicine && (
        <MedicineModal
          isDark={isDark}
          medicine={selectedMedicine}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMedicine(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedMedicine(null);
            loadMedicines();
          }}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({ icon, title, value, gradient, isDark }) {
  return (
    <div className="glass p-6 rounded-2xl shadow-xl card-hover group relative overflow-hidden">
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
            {title}
          </p>
          <p className="text-3xl font-bold dark:text-white">{value}</p>
        </div>
        <div className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className={`absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl`}></div>
    </div>
  );
}

// Medicine Modal Component
function MedicineModal({ isDark, medicine, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: medicine?.name || '',
    batch_no: medicine?.batch_no || '',
    category: medicine?.category || 'Tablet',
    manufacturer: medicine?.manufacturer || '',
    price: medicine?.price || '',
    quantity: medicine?.quantity || '',
    reorder_level: medicine?.reorder_level || 50,
    expiry_date: medicine?.expiry_date ? medicine.expiry_date.split('T')[0] : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name.trim(),
        batch_no: formData.batch_no.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity, 10),
        reorder_level: parseInt(formData.reorder_level, 10),
        expiry_date: formData.expiry_date
      };

      if (medicine) {
        await api.updateMedicine(medicine._id, payload);
        alert('✅ Medicine updated successfully!');
      } else {
        await api.addMedicine(payload);
        alert('✅ Medicine added successfully!');
      }
      onSuccess();
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="text-blue-500" />
            {medicine ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Medicine Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter medicine name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
              >
                {MEDICINE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Batch No *</label>
              <input
                type="text"
                required
                value={formData.batch_no}
                onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter manufacturer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price (₹) *</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quantity *</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reorder Level *</label>
              <input
                type="number"
                required
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
                placeholder="Enter reorder level"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {medicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
