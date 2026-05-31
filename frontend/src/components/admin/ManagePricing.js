'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";
const inputClass = "w-full p-[10px] border-2 border-[#ddd] rounded-[5px] text-base font-[inherit] outline-none focus:border-brand";

const ManagePricing = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', features: '', popular: false });

  const loadPricingPlans = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/pricing/', { headers: { Authorization: `Bearer ${token}` } });
      setPricingPlans(response.data);
    } catch (err) {
      console.error('Error loading pricing plans:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadPricingPlans(); }, [loadPricingPlans]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({ name: item.name || '', description: item.description || '', price: item.price || '', features: Array.isArray(item.features) ? item.features.join('\n') : '', popular: item.popular || false });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({ name: '', description: '', price: '', features: '', popular: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const featuresArray = formData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
      const dataToSend = { name: formData.name, description: formData.description, price: parseFloat(formData.price), features: featuresArray, popular: formData.popular };
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      if (isEditing && currentItem) {
        await api.put(`/admin/pricing/${currentItem.id}/`, dataToSend, { headers });
      } else {
        await api.post('/admin/pricing/', dataToSend, { headers });
      }
      handleCancel();
      loadPricingPlans();
    } catch (err) {
      console.error('Error saving pricing plan:', err);
      alert('Error saving pricing plan. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) return;
    try {
      const token = await getIdToken();
      await api.delete(`/admin/pricing/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      setPricingPlans(pricingPlans.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting pricing plan:', err);
      alert('Error deleting pricing plan. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Manage Pricing Plans</h1>
        </div>
        <div className="flex items-center gap-5">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1400px] mx-auto">
        <div className="mb-[30px]">
          <button
            onClick={() => { setCurrentItem(null); setFormData({ name: '', description: '', price: '', features: '', popular: false }); setIsEditing(true); }}
            disabled={isEditing}
            className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add New Pricing Plan
          </button>
        </div>

        {isEditing && (
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] mb-[30px]">
            <h2 className="m-0 mb-[25px] text-[#333]">{currentItem ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="name" className="block mb-2 font-semibold text-[#333]">Plan Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="description" className="block mb-2 font-semibold text-[#333]">Description *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="4" required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="price" className="block mb-2 font-semibold text-[#333]">Price *</label>
                <input type="number" id="price" name="price" step="0.01" min="0" value={formData.price} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="features" className="block mb-2 font-semibold text-[#333]">Features (one per line) *</label>
                <textarea id="features" name="features" value={formData.features} onChange={handleInputChange} rows="6" placeholder="Feature 1&#10;Feature 2&#10;Feature 3" required className={inputClass} />
                <small className="block mt-[5px] text-[#666] text-[0.85rem]">Enter each feature on a new line</small>
              </div>
              <div className="mb-5">
                <label className="flex items-center gap-[10px] font-normal cursor-pointer">
                  <input type="checkbox" name="popular" checked={formData.popular} onChange={handleInputChange} className="w-5 h-5 cursor-pointer" />
                  Mark as Popular
                </label>
              </div>
              <div className="flex gap-[15px] mt-[30px] md:flex-col">
                <button type="submit" className="py-3 px-6 rounded-[5px] border-none text-base font-semibold cursor-pointer transition-all duration-300 bg-brand text-white hover:bg-brand-dark">
                  {currentItem ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={handleCancel} className="py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-all duration-300 bg-[#f0f0f0] text-[#333] border-2 border-[#ddd] hover:bg-[#e0e0e0]">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          {pricingPlans.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-[#999] text-[1.1rem]">
              <p>No pricing plans yet. Click "Add New Pricing Plan" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] md:grid-cols-1 gap-[25px]">
              {pricingPlans.map(item => (
                <div key={item.id} className="border-2 border-[#eee] rounded-[10px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-[15px]">
                      <div>
                        <h3 className="m-0 mb-[5px] text-[#333]">{item.name}</h3>
                        {item.popular && <span className="bg-brand text-white py-1 px-3 rounded-xl text-[0.75rem] font-semibold whitespace-nowrap">Popular</span>}
                      </div>
                    </div>
                    <div className="text-[2rem] font-bold text-brand my-[15px]">
                      <span className="text-[1.2rem] align-top">$</span>
                      <span>{item.price}</span>
                    </div>
                    <p className="text-[#555] leading-relaxed my-[15px]">{item.description}</p>
                    <ul className="list-none p-0 my-5">
                      {item.features && item.features.map((feature, index) => (
                        <li key={index} className="text-[#666] py-2 pl-[25px] relative">
                          <span className="absolute left-0 text-brand font-bold">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center mt-5 pt-[15px] border-t border-[#eee] md:flex-col md:gap-[10px] md:items-start">
                      <span className="text-[#999] text-[0.85rem]">{formatDate(item.created_at)}</span>
                      <div className="flex gap-[10px]">
                        <button onClick={() => handleEdit(item)} className="py-[6px] px-3 rounded-[5px] border-none text-[0.9rem] font-medium cursor-pointer transition-all duration-300 bg-brand text-white hover:bg-brand-dark">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="py-[6px] px-3 rounded-[5px] border-none text-[0.9rem] font-medium cursor-pointer transition-all duration-300 bg-[#e53e3e] text-white hover:bg-[#c53030]">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePricing;
