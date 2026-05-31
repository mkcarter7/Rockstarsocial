'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";
const inputClass = "w-full p-[10px] border-2 border-[#ddd] rounded-[5px] text-base font-[inherit] outline-none focus:border-brand";

const ManageTestimonials = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '', client_title: '', company: '', testimonial_text: '',
    rating: 5, featured: false, client_image: null
  });

  const loadTestimonials = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/testimonials/', { headers: { Authorization: `Bearer ${token}` } });
      setTestimonials(response.data);
    } catch (err) {
      console.error('Error loading testimonials:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadTestimonials(); }, [loadTestimonials]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') setFormData(prev => ({ ...prev, [name]: files[0] }));
    else if (type === 'checkbox') setFormData(prev => ({ ...prev, [name]: checked }));
    else setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({ client_name: item.client_name || '', client_title: item.client_title || '', company: item.company || '', testimonial_text: item.testimonial_text || '', rating: item.rating || 5, featured: item.featured || false, client_image: null });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({ client_name: '', client_title: '', company: '', testimonial_text: '', rating: 5, featured: false, client_image: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append('client_name', formData.client_name);
      fd.append('client_title', formData.client_title);
      fd.append('company', formData.company);
      fd.append('testimonial_text', formData.testimonial_text);
      fd.append('rating', formData.rating);
      fd.append('featured', formData.featured);
      if (formData.client_image) fd.append('client_image', formData.client_image);

      const headers = { Authorization: `Bearer ${token}` };
      if (isEditing && currentItem) {
        await api.put(`/admin/testimonials/${currentItem.id}/`, fd, { headers, transformRequest: [(data) => data] });
      } else {
        await api.post('/admin/testimonials/', fd, { headers, transformRequest: [(data) => data] });
      }
      handleCancel();
      loadTestimonials();
    } catch (err) {
      console.error('Error saving testimonial:', err);
      alert('Error saving testimonial. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      const token = await getIdToken();
      await api.delete(`/admin/testimonials/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      setTestimonials(testimonials.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      alert('Error deleting testimonial. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const renderStars = (rating) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Manage Testimonials</h1>
        </div>
        <div className="flex items-center gap-5">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1400px] mx-auto">
        <div className="mb-[30px]">
          <button
            onClick={() => { setCurrentItem(null); setFormData({ client_name: '', client_title: '', company: '', testimonial_text: '', rating: 5, featured: false, client_image: null }); setIsEditing(true); }}
            disabled={isEditing}
            className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
          >
            + Add New Testimonial
          </button>
        </div>

        {isEditing && (
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] mb-[30px]">
            <h2 className="m-0 mb-[25px] text-[#333]">{currentItem ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label htmlFor="client_name" className="block mb-2 font-semibold text-[#333]">Client Name *</label>
                <input type="text" id="client_name" name="client_name" value={formData.client_name} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="client_title" className="block mb-2 font-semibold text-[#333]">Client Title</label>
                <input type="text" id="client_title" name="client_title" value={formData.client_title} onChange={handleInputChange} placeholder="e.g., CEO, Founder" className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="company" className="block mb-2 font-semibold text-[#333]">Company</label>
                <input type="text" id="company" name="company" value={formData.company} onChange={handleInputChange} className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="testimonial_text" className="block mb-2 font-semibold text-[#333]">Testimonial Text *</label>
                <textarea id="testimonial_text" name="testimonial_text" value={formData.testimonial_text} onChange={handleInputChange} rows="5" required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="rating" className="block mb-2 font-semibold text-[#333]">Rating (1-5) *</label>
                <input type="number" id="rating" name="rating" min="1" max="5" value={formData.rating} onChange={handleInputChange} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="client_image" className="block mb-2 font-semibold text-[#333]">Client Image</label>
                <input type="file" id="client_image" name="client_image" accept="image/*" onChange={handleInputChange} className="p-[5px]" />
                {currentItem && currentItem.client_image && !formData.client_image && (
                  <div className="mt-[10px]">
                    <img src={currentItem.client_image} alt={currentItem.client_name} className="max-w-[200px] max-h-[150px] rounded-[5px] border-2 border-[#ddd]" />
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
          {testimonials.length === 0 ? (
            <div className="text-center py-[60px] px-5 text-[#999] text-[1.1rem]">
              <p>No testimonials yet. Click "Add New Testimonial" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] md:grid-cols-1 gap-[25px]">
              {testimonials.map(item => (
                <div key={item.id} className="border-2 border-[#eee] rounded-[10px] overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  {item.client_image && (
                    <div className="w-full h-[200px] overflow-hidden bg-[#f0f0f0]">
                      <img src={item.client_image} alt={item.client_name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-[10px]">
                      <div>
                        <h3 className="m-0 mb-[5px] text-[#333]">{item.client_name}</h3>
                        {item.client_title && <p className="m-0 mb-[3px] text-[#666] text-[0.9rem]">{item.client_title}</p>}
                        {item.company && <p className="m-0 text-[#999] text-[0.85rem] italic">{item.company}</p>}
                      </div>
                      {item.featured && <span className="bg-brand text-white py-1 px-3 rounded-xl text-[0.75rem] font-semibold whitespace-nowrap">Featured</span>}
                    </div>
                    <div className="text-[#ffd700] text-[1.2rem] my-[10px]">{renderStars(item.rating)}</div>
                    <p className="text-[#555] leading-relaxed my-[15px] italic">{item.testimonial_text}</p>
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

export default ManageTestimonials;
