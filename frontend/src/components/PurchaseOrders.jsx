import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Edit, Check, X, Eye, Package } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const PurchaseOrders = () => {
  const { isDark } = useTheme();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newPO, setNewPO] = useState({
    supplier_id: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    medicine_id: '',
    quantity: '',
    unit_price: ''
  });

  const [receiveData, setReceiveData] = useState({
    items: [],
    payment_status: 'Pending'
  });

  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [purchaseOrders, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, suppliersData, medicinesData] = await Promise.all([
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getMedicines()
      ]);
      setPurchaseOrders(ordersData);
      setSuppliers(suppliersData);
      setMedicines(medicinesData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...purchaseOrders];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(po => po.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm) {
      filtered = filtered.filter(po => 
        po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const getStatistics = () => {
    return {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter(po => po.status === 'Pending').length,
      ordered: purchaseOrders.filter(po => po.status === 'Ordered').length,
      delivered: purchaseOrders.filter(po => po.status === 'Delivered').length
    };
  };

  const handleAddItem = () => {
    if (!newItem.medicine_id || !newItem.quantity || !newItem.unit_price) {
      setError('Please fill all item fields');
      return;
    }

    const medicine = medicines.find(m => m._id === newItem.medicine_id);
    if (!medicine) return;

    const item = {
      medicine_id: newItem.medicine_id,
      medicine_name: medicine.name,
      quantity: parseInt(newItem.quantity),
      unit_price: parseFloat(newItem.unit_price),
      total: parseInt(newItem.quantity) * parseFloat(newItem.unit_price)
    };

    setNewPO({
      ...newPO,
      items: [...newPO.items, item]
    });

    setNewItem({ medicine_id: '', quantity: '', unit_price: '' });
    setError('');
  };

  const handleRemoveItem = (index) => {
    setNewPO({
      ...newPO,
      items: newPO.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    
    if (!newPO.supplier_id) {
      setError('Please select a supplier');
      return;
    }

    if (newPO.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    try {
      const poData = {
        supplier_id: newPO.supplier_id,
        items: newPO.items.map(item => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      await api.createPurchaseOrder(poData);
      setSuccess('Purchase order created successfully');
      setShowCreateModal(false);
      setNewPO({ supplier_id: '', items: [] });
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create purchase order: ' + err.message);
    }
  };

  const handlePlaceOrder = async (poId) => {
    if (!window.confirm('Confirm supplier order placement for this PO?')) return;

    try {
      await api.placePurchaseOrder(poId, { ordered_by: 'Admin' });
      setSuccess('Purchase order marked as Ordered');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to mark purchase order as Ordered: ' + err.message);
    }
  };

  const handleReceivePO = async (e) => {
    e.preventDefault();

    const invalidItems = receiveData.items.filter(item => 
      !item.quantity_received || item.quantity_received <= 0 || !item.batch_number
    );

    if (invalidItems.length > 0) {
      setError('Please fill quantity received and batch number for all items');
      return;
    }

    try {
      const data = {
        items_received: receiveData.items.map(item => ({
          medicine_id: item.medicine_id,
          quantity_received: parseInt(item.quantity_received),
          batch_number: item.batch_number
        })),
        payment_status: receiveData.payment_status
      };

      await api.deliverPurchaseOrder(selectedPO.id, data);
      setSuccess('Purchase order marked as Delivered');
      setShowReceiveModal(false);
      setSelectedPO(null);
      setReceiveData({ items: [], payment_status: 'Pending' });
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to mark purchase order as Delivered: ' + err.message);
    }
  };

  const handleCancelPO = async (e) => {
    e.preventDefault();

    if (!cancelReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    try {
      await api.cancelPurchaseOrder(selectedPO.id, { reason: cancelReason });
      setSuccess('Purchase order cancelled successfully');
      setShowCancelModal(false);
      setSelectedPO(null);
      setCancelReason('');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to cancel purchase order: ' + err.message);
    }
  };

  const openReceiveModal = (po) => {
    setSelectedPO(po);
    setReceiveData({
      items: po.items.map(item => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicine_name,
        quantity_ordered: item.quantity,
        quantity_received: '',
        batch_number: ''
      })),
      payment_status: 'Pending'
    });
    setShowReceiveModal(true);
  };

  const openViewModal = (po) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  const openCancelModal = (po) => {
    setSelectedPO(po);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Ordered': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Delivered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status] || statusColors['Pending']}`}>
        {status}
      </span>
    );
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const getLifecycleSteps = (po) => {
    const isCancelled = po.status === 'Cancelled';
    const isOrderedDone = po.status === 'Ordered' || po.status === 'Delivered';
    const isDeliveredDone = po.status === 'Delivered';

    return [
      {
        key: 'created',
        label: 'Created',
        complete: true,
        timestamp: formatDateTime(po.created_at)
      },
      {
        key: 'ordered',
        label: 'Ordered',
        complete: isOrderedDone,
        timestamp: formatDateTime(po.ordered_at || po.approved_at)
      },
      {
        key: 'delivered',
        label: 'Delivered',
        complete: isDeliveredDone,
        timestamp: formatDateTime(po.delivered_at || po.received_at)
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        complete: isCancelled,
        timestamp: formatDateTime(po.cancelled_at),
        optional: true
      }
    ];
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <ClipboardList className="w-8 h-8 mr-3 text-blue-500" />
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create PO
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg dark:bg-red-900 dark:text-red-200">
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg dark:bg-green-900 dark:text-green-200">
            {success}
            <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total POs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ClipboardList className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Package className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ordered</p>
                <p className="text-2xl font-bold text-blue-600">{stats.ordered}</p>
              </div>
              <Check className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className={`p-6 rounded-lg shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <Package className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-lg shadow mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PO number or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['All', 'Pending', 'Ordered', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className={`rounded-lg shadow overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => (
                    <tr key={po.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{po.po_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{po.supplier_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(po.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{po.items?.length || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{po.total_amount?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(po.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openViewModal(po)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {po.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handlePlaceOrder(po.id)}
                                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Mark Ordered"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openCancelModal(po)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {po.status === 'Ordered' && (
                            <>
                              <button
                                onClick={() => openReceiveModal(po)}
                                className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                                title="Mark Delivered"
                              >
                                <Package className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => openCancelModal(po)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create Purchase Order</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPO({ supplier_id: '', items: [] });
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreatePO}>
                {/* Supplier Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Supplier *</label>
                  <select
                    value={newPO.supplier_id}
                    onChange={(e) => setNewPO({ ...newPO, supplier_id: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add Item Section */}
                <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-3">Add Items</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <select
                        value={newItem.medicine_id}
                        onChange={(e) => setNewItem({ ...newItem, medicine_id: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">Select Medicine</option>
                        {medicines.map((medicine) => (
                          <option key={medicine._id} value={medicine._id}>
                            {medicine.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        min="1"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-600 border-gray-500 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        step="0.01"
                        min="0.01"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-1" /> Add Item
                  </button>
                </div>

                {/* Items List */}
                {newPO.items.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Items ({newPO.items.length})</h3>
                    <div className="space-y-2">
                      {newPO.items.map((item, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg flex justify-between items-center ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.medicine_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)} = ₹{item.total.toFixed(2)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-right">
                      <p className="text-xl font-bold">
                        Total: ₹{calculateTotal(newPO.items).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPO({ supplier_id: '', items: [] });
                      setError('');
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Receive PO Modal */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Mark Delivery - {selectedPO.po_number}</h2>
                <button
                  onClick={() => {
                    setShowReceiveModal(false);
                    setSelectedPO(null);
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleReceivePO}>
                {/* Items */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-3">
                    {receiveData.items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        <p className="font-medium mb-2">{item.medicine_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          Ordered Quantity: {item.quantity_ordered}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Quantity Delivered *</label>
                            <input
                              type="number"
                              value={item.quantity_received}
                              onChange={(e) => {
                                const newItems = [...receiveData.items];
                                newItems[index].quantity_received = e.target.value;
                                setReceiveData({ ...receiveData, items: newItems });
                              }}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              min="1"
                              max={item.quantity_ordered}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Batch Number *</label>
                            <input
                              type="text"
                              value={item.batch_number}
                              onChange={(e) => {
                                const newItems = [...receiveData.items];
                                newItems[index].batch_number = e.target.value;
                                setReceiveData({ ...receiveData, items: newItems });
                              }}
                              className={`w-full px-3 py-2 rounded-lg border ${
                                isDark 
                                  ? 'bg-gray-600 border-gray-500 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Status */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Payment Status *</label>
                  <select
                    value={receiveData.payment_status}
                    onChange={(e) => setReceiveData({ ...receiveData, payment_status: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setSelectedPO(null);
                      setError('');
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Confirm Delivered
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {showViewModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Purchase Order Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPO(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* PO Information */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">PO Number</p>
                      <p className="font-semibold">{selectedPO.po_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Supplier</p>
                      <p className="font-semibold">{selectedPO.supplier_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                      <p className="font-semibold">
                        {new Date(selectedPO.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                      <p className="font-semibold text-lg">₹{selectedPO.total_amount?.toFixed(2)}</p>
                    </div>
                    {selectedPO.payment_status && (
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Payment Status</p>
                        <p className="font-semibold">{selectedPO.payment_status}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lifecycle */}
                <div>
                  <h3 className="font-semibold mb-3">Lifecycle</h3>
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="space-y-3">
                      {getLifecycleSteps(selectedPO)
                        .filter((step) => !step.optional || step.complete)
                        .map((step, index, arr) => (
                          <div key={step.key} className="flex items-start">
                            <div className="flex flex-col items-center mr-3">
                              <div
                                className={`w-3 h-3 rounded-full mt-1 ${
                                  step.complete ? 'bg-green-500' : isDark ? 'bg-gray-500' : 'bg-gray-300'
                                }`}
                              />
                              {index < arr.length - 1 && (
                                <div className={`w-0.5 h-8 mt-1 ${isDark ? 'bg-gray-500' : 'bg-gray-300'}`} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{step.label}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {step.timestamp || (step.complete ? 'Timestamp unavailable' : 'Not completed yet')}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-3">Items</h3>
                  <div className="space-y-2">
                    {selectedPO.items?.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.medicine_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Quantity: {item.quantity} × ₹{item.unit_price?.toFixed(2)}
                            </p>
                            {item.batch_number && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Batch: {item.batch_number}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">₹{(item.quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancel Reason */}
                {selectedPO.cancel_reason && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900' : 'bg-red-100'}`}>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cancellation Reason</p>
                    <p className="font-medium">{selectedPO.cancel_reason}</p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedPO(null);
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  } transition-colors`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel PO Modal */}
      {showCancelModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Cancel Purchase Order</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedPO(null);
                    setCancelReason('');
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCancelPO}>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    PO Number: <span className="font-semibold">{selectedPO.po_number}</span>
                  </p>
                  <label className="block text-sm font-medium mb-2">Cancellation Reason *</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    rows="4"
                    placeholder="Enter reason for cancellation..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedPO(null);
                      setCancelReason('');
                      setError('');
                    }}
                    className={`px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cancel Purchase Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
