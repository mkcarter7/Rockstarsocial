'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";
const inputClass = "w-full p-[10px] border-2 border-[#ddd] rounded-[5px] text-base font-[inherit] outline-none focus:border-brand";

const ManagePortfolio = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', website_url: '', category: '', featured: false, image: null
  });

  const loadPortfolioItems = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/portfolio/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioItems(response.data);
    } catch (err) {
      console.error('Error loading portfolio items:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadPortfolioItems(); }, [loadPortfolioItems]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') setFormData(prev => ({ ...prev, [name]: files[0] }));
    else if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({ title: item.title || '', description: item.description || '', website_url: item.website_url || '', category: item.category || '', featured: item.featured || false, image: null });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({ title: '', description: '', website_url: '', category: '', featured: false, image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('website_url', formData.website_url || '');
      formDataToSend.append('category', formData.category || '');
      formDataToSend.append('featured', formData.featured ? 'true' : 'false');
      if (formData.image) formDataToSend.append('image', formData.image);

      const headers = { Authorization: `Bearer ${token}` };
      if (isEditing && currentItem) {
        await api.put(`/admin/portfolio/${currentItem.id}/`, formDataToSend, { headers, transformRequest: [(data) => data] });
      } else {
        await api.post('/admin/portfolio/', formDataToSend, { headers, transformRequest: [(data) => data] });
      }
      handleCancel();
      loadPortfolioItems();
    } catch (err) {
      console.error('Error saving portfolio item:', err);
      const errorMessage = err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message || 'Unknown error occurred';
      alert(`Error saving portfolio item: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      const token = await getIdToken();
      await api.delete(`/admin/portfolio/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      setPortfolioItems(portfolioItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      alert('Error deleting portfolio item. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Manage Portfolio</h1>
        </div>
        <div className="flex items-center gap-5 md:flex-wrap md:justify-center md:w-full">
          <Link href="/" className={headerBtnClass}>Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1400px] mx-auto">
        <div className="mb-[30px]">
          <button
            onClick={() => { setCurrentItem(null); setFormData({ title: '', description: '', website_url: '', category: '', featured: false, image: null }); setIsEditing(true); }}
            disabled={isEditing}
            className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add New Portfolio Item
          </button>
        </div>

        {isEditing && (
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] mb-[30px]">
            <h2 className="m-0 mb-[25px] text-[#333]">{currentItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="title" className="block mb-2 font-semibold text-[#333]">Title *</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="description" className="block mb-2 font-semibold text-[#333]">Description *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="5" required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="website_url" className="block mb-2 font-semibold text-[#333]">Website URL</label>
                <input type="url" id="website_url" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://example.com" className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="category" className="block mb-2 font-semibold text-[#333]">Category</label>
                <input type="text" id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g., Web Design, E-commerce" className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="image" className="block mb-2 font-semibold text-[#333]">Image</label>
                <input type="file" id="image" name="image" accept="image/*" onChange={handleInputChange} className="p-[5px]" />
                {currentItem && currentItem.image && !formData.image && (
                  <div className="mt-[10px]">
                    <img src={currentItem.image} alt={currentItem.title} className="max-w-[200px] max-h-[150px] rounded-[5px] border-2 border-[#ddd]" />
                    <p className="mt-[5px] text-[0.9rem] text-[#666]">Current image</p>
                  </div>
                )}
              </div>
              <div className="mb-5">
                <label className="flex items-center gap-[10px] font-normal cursor-pointer">
                  <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="w-5 h-5 cursor-pointer" />
                  Featured
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
          {portfolioItems.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-[#999] text-[1.1rem]">
              <p>No portfolio items yet. Click "Add New Portfolio Item" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] md:grid-cols-1 gap-[25px]">
              {portfolioItems.map(item => (
                <div key={item.id} className="border-2 border-[#eee] rounded-[10px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  {item.image && (
                    <div className="w-full h-[200px] overflow-hidden bg-[#f0f0f0]">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-[10px]">
                      <h3 className="m-0 text-[#333] flex-1">{item.title}</h3>
                      {item.featured && <span className="bg-brand text-white py-1 px-3 rounded-xl text-[0.75rem] font-semibold whitespace-nowrap">Featured</span>}
                    </div>
                    {item.category && <p className="text-[#666] text-[0.9rem] my-[5px] italic">{item.category}</p>}
                    <p className="text-[#555] leading-relaxed my-[15px]">
                      {item.description.length > 100 ? `${item.description.substring(0, 100)}...` : item.description}
                    </p>
                    {item.website_url && (
                      <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="text-brand no-underline font-medium inline-block mt-[10px] hover:underline">
                        Visit Website →
                      </a>
                    )}
                    <div className="flex justify-between items-center mt-[15px] pt-[15px] border-t border-[#eee] md:flex-col md:gap-[10px] md:items-start">
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

export default ManagePortfolio;
