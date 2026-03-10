const API_BASE = 'http://localhost:8000';

const PO_STATUS_LABELS = {
  pending: 'Pending',
  ordered: 'Ordered',
  approved: 'Ordered',
  delivered: 'Delivered',
  received: 'Delivered',
  cancelled: 'Cancelled'
};

const normalizePurchaseOrder = (po) => ({
  ...po,
  id: po.id || po._id,
  status: PO_STATUS_LABELS[(po.status || '').toLowerCase()] || po.status || 'Pending'
});

export const api = {
  // Medicines
  getMedicines: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching medicines:', error);
      return [];
    }
  },
  
  addMedicine: async (medicine) => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
      });
      if (!res.ok) {
        let detail = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          if (Array.isArray(errorData?.detail)) {
            detail = errorData.detail.map(item => item.msg).join(', ');
          } else if (typeof errorData?.detail === 'string') {
            detail = errorData.detail;
          }
        } catch (_) {
          // Keep fallback message if response body is not JSON.
        }
        throw new Error(detail);
      }
      return await res.json();
    } catch (error) {
      console.error('Error adding medicine:', error);
      throw error;
    }
  },
  
  updateMedicine: async (id, medicine) => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medicine)
      });
      if (!res.ok) {
        let detail = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          if (Array.isArray(errorData?.detail)) {
            detail = errorData.detail.map(item => item.msg).join(', ');
          } else if (typeof errorData?.detail === 'string') {
            detail = errorData.detail;
          }
        } catch (_) {
          // Keep fallback message if response body is not JSON.
        }
        throw new Error(detail);
      }
      return await res.json();
    } catch (error) {
      console.error('Error updating medicine:', error);
      throw error;
    }
  },
  
  deleteMedicine: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    }
  },
  
  getExpiringMedicines: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/medicines/expiring`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching expiring medicines:', error);
      return [];
    }
  },
  
  // Sales
  getSales: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sales/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching sales:', error);
      return [];
    }
  },
  
  addSale: async (sale) => {
    try {
      const res = await fetch(`${API_BASE}/api/sales/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to add sale');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error adding sale:', error);
      throw error;
    }
  },
  
  getSalesSummary: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sales/summary`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching sales summary:', error);
      return [];
    }
  },
  
  // Predictions
  getPredictions: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/predictions/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return { message: 'Error loading predictions' };
    }
  },

  // Customers
  getCustomers: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  addCustomer: async (customer) => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to add customer');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },

  getCustomer: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, customer) => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  getCustomerStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/customers/stats/summary`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return { total_customers: 0, top_customers: [] };
    }
  },

  // Billing
  getBills: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  },

  createBill: async (billData) => {
    try {
      // Generate bill number
      const timestamp = Date.now();
      const billNumber = `BILL-${timestamp}`;
      
      const res = await fetch(`${API_BASE}/api/billing/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...billData,
          bill_number: billNumber
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to create bill');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  },

  getBill: async (billId) => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/${billId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching bill:', error);
      throw error;
    }
  },

  deleteBill: async (billId) => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/${billId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  },

  getBillStats: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/stats/summary`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching bill stats:', error);
      return { total_bills: 0, total_revenue: 0, avg_bill_value: 0 };
    }
  },

  // Reports
  getSalesReport: async (startDate, endDate, period = 'monthly') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      params.append('period', period);
      
      const res = await fetch(`${API_BASE}/api/reports/sales?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  },

  getInventoryReport: async (category = null) => {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      
      const res = await fetch(`${API_BASE}/api/reports/inventory?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }
  },

  getCustomerReport: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await fetch(`${API_BASE}/api/reports/customers?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching customer report:', error);
      throw error;
    }
  },

  // Notifications
  getNotifications: async (read = null, priority = null, limit = 50) => {
    try {
      const params = new URLSearchParams();
      if (read !== null) params.append('read', read);
      if (priority) params.append('priority', priority);
      if (limit) params.append('limit', limit);
      
      const res = await fetch(`${API_BASE}/api/notifications/?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  getUnreadNotificationCount: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/unread-count`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { unread_count: 0 };
    }
  },

  generateNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/generate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error generating notifications:', error);
      throw error;
    }
  },

  markNotificationAsRead: async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  clearAllNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/clear-all`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },

  getNotificationSummary: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/summary`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching notification summary:', error);
      return { by_priority: {}, by_type: {}, total_unread: 0 };
    }
  },

  // Suppliers
  getSuppliers: async (search = null, activeOnly = false) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (activeOnly) params.append('active_only', activeOnly);
      
      const res = await fetch(`${API_BASE}/api/suppliers/?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  },

  getSupplier: async (supplierId) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  },

  addSupplier: async (supplier) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  },

  updateSupplier: async (supplierId, supplier) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  },

  deleteSupplier: async (supplierId) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  getSupplierHistory: async (supplierId) => {
    try {
      const res = await fetch(`${API_BASE}/api/suppliers/${supplierId}/history`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching supplier history:', error);
      throw error;
    }
  },

  // Purchase Orders
  getPurchaseOrders: async (status = null, supplierId = null, startDate = null, endDate = null) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (supplierId) params.append('supplier_id', supplierId);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const res = await fetch(`${API_BASE}/api/purchase-orders/?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.map(normalizePurchaseOrder);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return [];
    }
  },

  getPurchaseOrder: async (poId) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return normalizePurchaseOrder(data);
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      throw error;
    }
  },

  createPurchaseOrder: async (po) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(po)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return normalizePurchaseOrder(data);
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },

  updatePurchaseOrder: async (poId, po) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(po)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return normalizePurchaseOrder(data);
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  },

  approvePurchaseOrder: async (poId, approvalData) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalData)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return normalizePurchaseOrder(data);
    } catch (error) {
      console.error('Error approving purchase order:', error);
      throw error;
    }
  },

  placePurchaseOrder: async (poId, orderData) => {
    return api.approvePurchaseOrder(poId, orderData);
  },

  receivePurchaseOrder: async (poId, receiveData) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}/receive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiveData)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return {
        ...data,
        purchase_order: data?.purchase_order ? normalizePurchaseOrder(data.purchase_order) : data?.purchase_order
      };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      throw error;
    }
  },

  deliverPurchaseOrder: async (poId, deliveryData) => {
    return api.receivePurchaseOrder(poId, deliveryData);
  },

  cancelPurchaseOrder: async (poId, cancelData) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelData)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return normalizePurchaseOrder(data);
    } catch (error) {
      console.error('Error cancelling purchase order:', error);
      throw error;
    }
  },

  deletePurchaseOrder: async (poId) => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/${poId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  },

  getPOStatistics: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/purchase-orders/summary/statistics`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error fetching PO statistics:', error);
      return { total_purchase_orders: 0, by_status: {}, total_amount_received: 0 };
    }
  }
};