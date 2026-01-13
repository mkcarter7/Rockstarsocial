import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './ManageTestimonials.css';

const ManageTestimonials = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    client_title: '',
    company: '',
    testimonial_text: '',
    rating: 5,
    featured: false,
    client_image: null
  });

  const loadTestimonials = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/testimonials/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(response.data);
    } catch (err) {
      console.error('Error loading testimonials:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) : value }));
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      client_name: item.client_name || '',
      client_title: item.client_title || '',
      company: item.company || '',
      testimonial_text: item.testimonial_text || '',
      rating: item.rating || 5,
      featured: item.featured || false,
      client_image: null
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({
      client_name: '',
      client_title: '',
      company: '',
      testimonial_text: '',
      rating: 5,
      featured: false,
      client_image: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const formDataToSend = new FormData();
      formDataToSend.append('client_name', formData.client_name);
      formDataToSend.append('client_title', formData.client_title);
      formDataToSend.append('company', formData.company);
      formDataToSend.append('testimonial_text', formData.testimonial_text);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('featured', formData.featured);
      if (formData.client_image) {
        formDataToSend.append('client_image', formData.client_image);
      }

      if (isEditing && currentItem) {
        await api.put(`/admin/testimonials/${currentItem.id}/`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          transformRequest: [(data) => data]
        });
      } else {
        await api.post('/admin/testimonials/', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          transformRequest: [(data) => data]
        });
      }
      
      handleCancel();
      loadTestimonials();
    } catch (err) {
      console.error('Error saving testimonial:', err);
      alert('Error saving testimonial. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }
    try {
      const token = await getIdToken();
      await api.delete(`/admin/testimonials/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(testimonials.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting testimonial:', err);
      alert('Error deleting testimonial. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return <div className="testimonials-loading">Loading...</div>;
  }

  return (
    <div className="admin-testimonials">
      <header className="testimonials-header">
        <div className="testimonials-header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Manage Testimonials</h1>
        </div>
        <div className="testimonials-header-right">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="testimonials-content">
        <div className="testimonials-actions">
          <button 
            className="btn-add"
            onClick={() => {
              setCurrentItem(null);
              setFormData({
                client_name: '',
                client_title: '',
                company: '',
                testimonial_text: '',
                rating: 5,
                featured: false,
                client_image: null
              });
              setIsEditing(true);
            }}
            disabled={isEditing}
          >
            + Add New Testimonial
          </button>
        </div>

        {isEditing && (
          <div className="testimonials-form-container">
            <div className="testimonials-form">
              <h2>{currentItem ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="client_name">Client Name *</label>
                  <input
                    type="text"
                    id="client_name"
                    name="client_name"
                    value={formData.client_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client_title">Client Title</label>
                  <input
                    type="text"
                    id="client_title"
                    name="client_title"
                    value={formData.client_title}
                    onChange={handleInputChange}
                    placeholder="e.g., CEO, Founder"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="testimonial_text">Testimonial Text *</label>
                  <textarea
                    id="testimonial_text"
                    name="testimonial_text"
                    value={formData.testimonial_text}
                    onChange={handleInputChange}
                    rows="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rating">Rating (1-5) *</label>
                  <input
                    type="number"
                    id="rating"
                    name="rating"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client_image">Client Image</label>
                  <input
                    type="file"
                    id="client_image"
                    name="client_image"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                  {currentItem && currentItem.client_image && !formData.client_image && (
                    <div className="current-image">
                      <img src={currentItem.client_image} alt={currentItem.client_name} />
                      <p>Current image</p>
                    </div>
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                    />
                    Featured
                  </label>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    {currentItem ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="testimonials-list">
          {testimonials.length === 0 ? (
            <div className="no-items">
              <p>No testimonials yet. Click "Add New Testimonial" to get started.</p>
            </div>
          ) : (
            <div className="testimonials-grid">
              {testimonials.map(item => (
                <div key={item.id} className="testimonial-card">
                  {item.client_image && (
                    <div className="testimonial-image">
                      <img src={item.client_image} alt={item.client_name} />
                    </div>
                  )}
                  <div className="testimonial-card-content">
                    <div className="testimonial-card-header">
                      <div>
                        <h3>{item.client_name}</h3>
                        {item.client_title && <p className="testimonial-title">{item.client_title}</p>}
                        {item.company && <p className="testimonial-company">{item.company}</p>}
                      </div>
                      {item.featured && <span className="featured-badge">Featured</span>}
                    </div>
                    <div className="testimonial-rating">
                      {renderStars(item.rating)}
                    </div>
                    <p className="testimonial-text">{item.testimonial_text}</p>
                    <div className="testimonial-card-footer">
                      <span className="testimonial-date">{formatDate(item.created_at)}</span>
                      <div className="testimonial-card-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
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
