import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { MEDICINE_CATEGORIES } from '../constants/medicine';

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    batch_no: '',
    quantity: '',
    price: '',
    expiry_date: '',
    category: '',
    reorder_level: 50,
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    const data = await api.getMedicines();
    setMedicines(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const medicineData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
      reorder_level: parseInt(formData.reorder_level),
    };

    if (editingId) {
      await api.updateMedicine(editingId, medicineData);
    } else {
      await api.addMedicine(medicineData);
    }

    resetForm();
    loadMedicines();
  };

  const handleEdit = (medicine) => {
    setFormData(medicine);
    setEditingId(medicine._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      await api.deleteMedicine(id);
      loadMedicines();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      batch_no: '',
      quantity: '',
      price: '',
      expiry_date: '',
      category: '',
      reorder_level: 50,
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          Add Medicine
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Medicine Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <input
              type="text"
              placeholder="Batch No"
              value={formData.batch_no}
              onChange={(e) => setFormData({ ...formData, batch_no: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <input
              type="date"
              placeholder="Expiry Date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="border p-2 rounded"
              required
            >
              <option value="" disabled>Select Category</option>
              {MEDICINE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Reorder Level"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
              className="border p-2 rounded"
              required
            />

            <div className="col-span-2 flex gap-2 mt-4">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {editingId ? 'Update' : 'Add'} Medicine
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medicine Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Batch</th>
              <th className="border p-3 text-left">Quantity</th>
              <th className="border p-3 text-left">Price</th>
              <th className="border p-3 text-left">Expiry</th>
              <th className="border p-3 text-left">Category</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {medicines.map((med) => {
              const isLowStock = med.quantity < med.reorder_level;

              return (
                <tr
                  key={med._id}
                  className={isLowStock ? 'bg-red-100' : ''}
                >
                  <td className="border p-3 flex items-center gap-2">
                    {isLowStock && (
                      <AlertTriangle className="text-red-600 w-4 h-4" />
                    )}
                    {med.name}
                  </td>

                  <td className="border p-3">{med.batch_no}</td>
                  <td className="border p-3">{med.quantity}</td>
                  <td className="border p-3">₹{med.price}</td>
                  <td className="border p-3">{med.expiry_date}</td>
                  <td className="border p-3">{med.category}</td>

                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleEdit(med)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="inline w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(med._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="inline w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {medicines.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No medicines found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
