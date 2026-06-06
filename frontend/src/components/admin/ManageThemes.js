'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";
const inputClass = "w-full p-[10px] border-2 border-[#ddd] rounded-[5px] text-base font-[inherit] outline-none focus:border-brand";

const emptyForm = { name: '', description: '', theme_type: 'birthday', category: '', price: '', demo_url: '', featured: false, preview_image: null, features: '' };

const ManageThemes = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadThemes = useCallback(async () => {
    try {
      const token = await getIdToken();
      const [themesRes, categoriesRes] = await Promise.all([
        api.get('/admin/theme-files/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/theme-categories/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setThemes(themesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error loading themes:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadThemes(); }, [loadThemes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') setFormData(prev => ({ ...prev, [name]: files[0] }));
    else if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({ name: item.name || '', description: item.description || '', theme_type: item.theme_type || 'birthday', category: item.category || '', price: item.price || '', demo_url: item.demo_url || '', featured: item.featured || false, preview_image: null, features: Array.isArray(item.features) ? item.features.join('\n') : '' });
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setCurrentItem(null); setFormData(emptyForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('theme_type', formData.theme_type);
      if (formData.category) fd.append('category', formData.category);
      fd.append('price', formData.price);
      fd.append('demo_url', formData.demo_url);
      fd.append('featured', formData.featured ? 'true' : 'false');
      const featuresArray = formData.features.split('\n').map(f => f.trim()).filter(f => f.length > 0);
      fd.append('features', JSON.stringify(featuresArray));
      if (formData.preview_image) fd.append('preview_image', formData.preview_image);

      const headers = { Authorization: `Bearer ${token}` };
      if (isEditing && currentItem) {
        await api.put(`/admin/theme-files/${currentItem.id}/`, fd, { headers, transformRequest: [(data) => data] });
      } else {
        await api.post('/admin/theme-files/', fd, { headers, transformRequest: [(data) => data] });
      }
      handleCancel();
      loadThemes();
    } catch (err) {
      console.error('Error saving theme:', err);
      let errorMessage = 'Error saving theme. Please try again.';
      if (err.response?.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
          if (err.response.data.details) errorMessage += `\n\n${err.response.data.details}`;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          const fieldErrors = Object.entries(err.response.data).map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`).join('\n');
          if (fieldErrors) errorMessage = `Validation errors:\n${fieldErrors}`;
        }
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;
    try {
      const token = await getIdToken();
      await api.delete(`/admin/theme-files/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      setThemes(themes.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting theme:', err);
      alert('Error deleting theme. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatPrice = (price) => `$${parseFloat(price).toFixed(2)}`;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Manage Themes</h1>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/" className={headerBtnClass}>Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1400px] mx-auto">
        <div className="mb-[30px]">
          <button
            onClick={() => { setCurrentItem(null); setFormData(emptyForm); setIsEditing(true); }}
            disabled={isEditing}
            className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add New Theme
          </button>
        </div>

        {isEditing && (
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] mb-[30px]">
            <h2 className="m-0 mb-[25px] text-[#333]">{currentItem ? 'Edit Theme' : 'Add New Theme'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="name" className="block mb-2 font-semibold text-[#333]">Theme Name *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="description" className="block mb-2 font-semibold text-[#333]">Description *</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="5" required className={inputClass} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-5">
                <div className="mb-5">
                  <label htmlFor="theme_type" className="block mb-2 font-semibold text-[#333]">Theme Type *</label>
                  <select id="theme_type" name="theme_type" value={formData.theme_type} onChange={handleInputChange} required className={inputClass}>
                    <option value="birthday">Birthday</option>
                    <option value="wedding">Wedding</option>
                    <option value="event">Event</option>
                    <option value="business">Business</option>
                    <option value="boutique">Boutique</option>
                    <option value="ecommerce">Ecommerce</option>
                  </select>
                </div>
                <div className="mb-5">
                  <label htmlFor="category" className="block mb-2 font-semibold text-[#333]">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleInputChange} className={inputClass}>
                    <option value="">None</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-1 gap-5">
                <div className="mb-5">
                  <label htmlFor="price" className="block mb-2 font-semibold text-[#333]">Price *</label>
                  <input type="number" id="price" name="price" step="0.01" min="0" value={formData.price} onChange={handleInputChange} required className={inputClass} />
                </div>
                <div className="mb-5">
                  <label htmlFor="demo_url" className="block mb-2 font-semibold text-[#333]">Demo URL</label>
                  <input type="url" id="demo_url" name="demo_url" value={formData.demo_url} onChange={handleInputChange} placeholder="https://demo.example.com" className={inputClass} />
                </div>
              </div>
              <div className="mb-5">
                <label htmlFor="features" className="block mb-2 font-semibold text-[#333]">Features (one per line)</label>
                <textarea id="features" name="features" value={formData.features} onChange={handleInputChange} rows="5" placeholder="Feature 1&#10;Feature 2&#10;Feature 3" className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="preview_image" className="block mb-2 font-semibold text-[#333]">Preview Image *</label>
                <input type="file" id="preview_image" name="preview_image" accept="image/*" onChange={handleInputChange} required={!currentItem} className="p-[5px]" />
                {currentItem && currentItem.preview_image && !formData.preview_image && (
                  <div className="mt-[10px]">
                    <img src={currentItem.preview_image} alt={currentItem.name} className="max-w-[200px] max-h-[150px] rounded-[5px] border-2 border-[#ddd]" />
                    <p className="mt-[5px] text-[0.9rem] text-[#666]">Current preview image</p>
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
          {themes.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-[#999] text-[1.1rem]">
              <p>No themes yet. Click "Add New Theme" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] md:grid-cols-1 gap-[25px]">
              {themes.map(item => (
                <div key={item.id} className="border-2 border-[#eee] rounded-[10px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  {item.preview_image && (
                    <div className="w-full h-[200px] overflow-hidden bg-[#f0f0f0]">
                      <img src={item.preview_image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-[10px]">
                      <div>
                        <h3 className="m-0 mb-[5px] text-[#333]">{item.name}</h3>
                        <p className="m-0 mb-[3px] text-[#666] text-[0.9rem] font-medium">{item.theme_type_display || item.theme_type}</p>
                        {item.category_name && <p className="m-0 text-[#999] text-[0.85rem] italic">{item.category_name}</p>}
                      </div>
                      {item.featured && <span className="bg-brand text-white py-1 px-3 rounded-xl text-[0.75rem] font-semibold whitespace-nowrap">Featured</span>}
                    </div>
                    <p className="text-[1.5rem] font-bold text-brand my-[10px]">{formatPrice(item.price)}</p>
                    <p className="text-[#555] leading-relaxed my-[15px]">
                      {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
                    </p>
                    {Array.isArray(item.features) && item.features.length > 0 && (
                      <ul className="list-none p-0 my-[15px]">
                        {item.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-[#666] py-[5px] pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-bold">{feature}</li>
                        ))}
                        {item.features.length > 3 && <li className="text-[#666] py-[5px] pl-5 relative before:content-['✓'] before:absolute before:left-0 before:text-brand before:font-bold">+{item.features.length - 3} more</li>}
                      </ul>
                    )}
                    {item.demo_url && (
                      <a href={item.demo_url} target="_blank" rel="noopener noreferrer" className="text-brand no-underline font-medium inline-block mt-[10px] hover:underline">View Demo →</a>
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

export default ManageThemes;
