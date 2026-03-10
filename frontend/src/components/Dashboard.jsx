import React, { useState, useEffect } from 'react';
import QuickActions from './QuickActions';
import MonthlySalesTrend from './MonthlySalesTrend';
import RecentSalesTable from './RecentSalesTable';
import CustomerModal from './CustomerModal';
import { useTheme } from '../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Package, AlertCircle, DollarSign, X } from 'lucide-react';
import { api } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard({ onBillCreated }) {
  const { isDark } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [expiring, setExpiring] = useState([]);

  const buildSalesFeed = (salesData, billsData) => {
    const directSales = (salesData || []).map((sale) => ({
      ...sale,
      source: 'sales'
    }));

    const billSales = (billsData || []).flatMap((bill) =>
      (bill.items || []).map((item, index) => ({
        _id: `${bill._id || bill.bill_number || 'bill'}-${index}`,
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        sale_date: bill.created_at,
        source: 'billing',
        bill_number: bill.bill_number
      }))
    );

    return [...directSales, ...billSales].sort(
      (a, b) => new Date(b.sale_date) - new Date(a.sale_date)
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medData, salesData, billsData, expiringData] = await Promise.all([
        api.getMedicines(),
        api.getSales(),
        api.getBills(),
        api.getExpiringMedicines(),
      ]);

      const unifiedSalesFeed = buildSalesFeed(salesData, billsData);

      setMedicines(medData);
      setSales(unifiedSalesFeed);
      setExpiring(expiringData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const totalStock = medicines.reduce((sum, med) => sum + med.quantity, 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStock = medicines.filter((med) => med.quantity < med.reorder_level).length;

  const categoryData = medicines.reduce((acc, med) => {
    const existing = acc.find((item) => item.name === med.category);
    if (existing) {
      existing.value += med.quantity;
    } else {
      acc.push({ name: med.category, value: med.quantity });
    }
    return acc;
  }, []);

  // Modal state for actions
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const handleAction = (actionId) => {
    setModalType(actionId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    loadData(); // Refresh data when modal closes
  };

  const handleCustomerSubmit = async (customerData) => {
    try {
      await api.addCustomer(customerData);
      alert('✅ Customer added successfully!');
      closeModal();
    } catch (error) {
      alert('❌ Error adding customer: ' + error.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Overview of your pharmacy operations</p>
        </div>
        {/* Quick Actions */}
        <QuickActions onAction={handleAction} isDark={isDark} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Package />} title="Total Stock" value={totalStock} color="blue" gradient="from-blue-500 to-cyan-500" />
        <StatCard icon={<DollarSign />} title="Total Revenue" value={`₹${totalRevenue.toFixed(2)}`} color="green" gradient="from-green-500 to-emerald-500" />
        <StatCard icon={<AlertCircle />} title="Low Stock Items" value={lowStock} color="red" gradient="from-red-500 to-pink-500" />
        <StatCard icon={<TrendingUp />} title="Total Sales" value={sales.length} color="purple" gradient="from-purple-500 to-indigo-500" />
      </div>

      {/* Monthly Sales Trend & Recent Sales Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl shadow-xl card-hover">
          <MonthlySalesTrend data={sales} isDark={isDark} />
        </div>
        <div className="glass p-6 rounded-2xl shadow-xl card-hover">
          <RecentSalesTable sales={sales} isDark={isDark} />
        </div>
      </div>

      {/* Stock by Category */}
      <div className="glass p-6 rounded-2xl shadow-xl card-hover">
        <h2 className="text-xl font-bold mb-4 gradient-text">Stock by Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Expiring Medicines Alert */}
      {expiring.length > 0 && (
        <div className="glass border-l-4 border-yellow-500 p-6 rounded-2xl shadow-xl bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ {expiring.length} Medicine(s) Expiring Soon
              </h2>
              <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
                {expiring.slice(0, 3).map((med) => (
                  <li key={med._id || med.id || med.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="font-medium">{med.name}</span> - 
                    <span className="text-sm">{med.days_until_expiry} days left</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal for actions */}
      {showModal && modalType === 'new-bill' && (
        <NewBillModal
          isDark={isDark}
          onClose={closeModal}
          medicines={medicines}
          onBillCreated={onBillCreated}
        />
      )}
      
      {showModal && modalType === 'add-stock' && (
        <AddStockModal isDark={isDark} onClose={closeModal} medicines={medicines} />
      )}
      
      {showModal && modalType === 'add-customer' && (
        <CustomerModal 
          isOpen={showModal} 
          onClose={closeModal} 
          onSubmit={handleCustomerSubmit}
          isDark={isDark}
        />
      )}
      
      {showModal && modalType === 'view-reports' && (
        <ViewReportsModal isDark={isDark} onClose={closeModal} sales={sales} medicines={medicines} />
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color, gradient }) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="glass p-6 rounded-2xl shadow-xl card-hover group relative overflow-hidden">
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">{title}</p>
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

// New Bill Modal Component
function NewBillModal({ isDark, onClose, medicines, onBillCreated }) {
  const [formData, setFormData] = useState({
    medicine_id: '',
    medicine_name: '',
    quantity: '',
    price: '',
    available_stock: 0,
    customer_name: 'Walk-in Customer',
    payment_mode: 'Cash',
    gst_percentage: 18,
  });
  const [error, setError] = useState('');

  const handleMedicineSelect = (e) => {
    const selectedMed = medicines.find((m) => m._id === e.target.value);
    if (selectedMed) {
      setFormData({
        medicine_id: selectedMed._id,
        medicine_name: selectedMed.name,
        quantity: '',
        price: selectedMed.price,
        available_stock: selectedMed.quantity,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestedQty = parseInt(formData.quantity);

    if (requestedQty > formData.available_stock) {
      setError(`Only ${formData.available_stock} units available!`);
      return;
    }

    const unitPrice = parseFloat(formData.price);
    const lineTotal = requestedQty * unitPrice;
    const gstPercentage = parseFloat(formData.gst_percentage) || 0;
    const gstAmount = (lineTotal * gstPercentage) / 100;
    const grandTotal = lineTotal + gstAmount;

    const billData = {
      customer_name: formData.customer_name?.trim() || 'Walk-in Customer',
      payment_mode: formData.payment_mode,
      items: [
        {
          medicine_id: formData.medicine_id,
          medicine_name: formData.medicine_name,
          quantity: requestedQty,
          price: unitPrice,
          total: lineTotal,
        },
      ],
      subtotal: lineTotal,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
      grand_total: grandTotal,
    };

    try {
      await api.createBill(billData);
      alert('✅ Bill created successfully!');
      onClose();
      if (onBillCreated) {
        onBillCreated();
      }
    } catch (error) {
      setError(error.message || 'Error creating bill');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Create New Bill</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Medicine *</label>
            <select
              required
              onChange={handleMedicineSelect}
              value={formData.medicine_id}
              className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            >
              <option value="">-- Select Medicine --</option>
              {medicines.map((med) => (
                <option key={med._id} value={med._id}>
                  {med.name} (Stock: {med.quantity})
                </option>
              ))}
            </select>
          </div>

          {formData.medicine_id && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Mode *</label>
                <select
                  required
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={formData.available_stock}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                />
                <p className="text-xs text-gray-500 mt-1">Available: {formData.available_stock} units</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300 bg-gray-100'}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GST %</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.gst_percentage}
                  onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-semibold">
                  Subtotal: ₹{(formData.quantity * formData.price || 0).toFixed(2)}
                </p>
                <p className="text-sm">
                  GST: ₹{(((formData.quantity * formData.price || 0) * (parseFloat(formData.gst_percentage) || 0)) / 100).toFixed(2)}
                </p>
                <p className="font-semibold">
                  Grand Total: ₹{((formData.quantity * formData.price || 0) + (((formData.quantity * formData.price || 0) * (parseFloat(formData.gst_percentage) || 0)) / 100)).toFixed(2)}
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Stock Modal Component
function AddStockModal({ isDark, onClose, medicines }) {
  const [formData, setFormData] = useState({
    medicine_id: '',
    quantity: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const medicine = medicines.find(m => m._id === formData.medicine_id);
    
    if (!medicine) return;

    const updatedMedicine = {
      ...medicine,
      quantity: medicine.quantity + parseInt(formData.quantity)
    };

    try {
      await api.updateMedicine(medicine._id, updatedMedicine);
      alert('✅ Stock updated successfully!');
      onClose();
    } catch (error) {
      alert('❌ Error updating stock: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-2xl max-w-md w-full p-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add Stock</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Medicine *</label>
            <select
              required
              value={formData.medicine_id}
              onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            >
              <option value="">-- Select Medicine --</option>
              {medicines.map((med) => (
                <option key={med._id} value={med._id}>
                  {med.name} (Current: {med.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity to Add *</label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              placeholder="Enter quantity"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Reports Modal Component
function ViewReportsModal({ isDark, onClose, sales, medicines }) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const avgTransaction = totalSales / (totalTransactions || 1);
  const totalMedicines = medicines.length;
  const lowStockCount = medicines.filter(m => m.quantity < m.reorder_level).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Performance Reports</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Sales Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Sales Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalSales.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalTransactions}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Transaction</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{avgTransaction.toFixed(2)}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-orange-50'}`}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Medicines</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalMedicines}</p>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Inventory Status</h3>
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between mb-2">
                <span>Total Stock</span>
                <span className="font-semibold">{medicines.reduce((sum, m) => sum + m.quantity, 0)} units</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Low Stock Items</span>
                <span className={`font-semibold ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {lowStockCount}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Medicines */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Top 5 Selling Medicines</h3>
            <div className="space-y-2">
              {sales
                .reduce((acc, sale) => {
                  const existing = acc.find(s => s.medicine_name === sale.medicine_name);
                  if (existing) {
                    existing.quantity += sale.quantity;
                    existing.total += sale.total;
                  } else {
                    acc.push({ ...sale });
                  }
                  return acc;
                }, [])
                .sort((a, b) => b.total - a.total)
                .slice(0, 5)
                .map((sale, idx) => (
                  <div key={sale.medicine_id || sale._id || idx} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="flex justify-between">
                      <span className="font-medium">{sale.medicine_name}</span>
                      <span className="text-green-600 dark:text-green-400">₹{sale.total.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">{sale.quantity} units sold</p>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
