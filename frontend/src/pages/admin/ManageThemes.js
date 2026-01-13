import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import './ManageThemes.css';

const ManageThemes = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme_type: 'birthday',
    category: '',
    price: '',
    demo_url: '',
    featured: false,
    preview_image: null,
    download_file: null,
    features: ''
  });

  const loadThemes = useCallback(async () => {
    try {
      const token = await getIdToken();
      const [themesRes, categoriesRes] = await Promise.all([
        api.get('/admin/themes/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/admin/theme-categories/', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setThemes(themesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error loading themes:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      theme_type: item.theme_type || 'birthday',
      category: item.category || '',
      price: item.price || '',
      demo_url: item.demo_url || '',
      featured: item.featured || false,
      preview_image: null,
      download_file: null,
      features: Array.isArray(item.features) ? item.features.join('\n') : ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({
      name: '',
      description: '',
      theme_type: 'birthday',
      category: '',
      price: '',
      demo_url: '',
      featured: false,
      preview_image: null,
      download_file: null,
      features: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('theme_type', formData.theme_type);
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      formDataToSend.append('price', formData.price);
      formDataToSend.append('demo_url', formData.demo_url);
      formDataToSend.append('featured', formData.featured);
      
      // Convert features string to JSON array
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      formDataToSend.append('features', JSON.stringify(featuresArray));
      
      if (formData.preview_image) {
        formDataToSend.append('preview_image', formData.preview_image);
      }
      if (formData.download_file) {
        formDataToSend.append('download_file', formData.download_file);
      }

      if (isEditing && currentItem) {
        await api.put(`/admin/themes/${currentItem.id}/`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await api.post('/admin/themes/', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      handleCancel();
      loadThemes();
    } catch (err) {
      console.error('Error saving theme:', err);
      alert('Error saving theme. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) {
      return;
    }
    try {
      const token = await getIdToken();
      await api.delete(`/admin/themes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setThemes(themes.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting theme:', err);
      alert('Error deleting theme. Please try again.');
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

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return <div className="themes-loading">Loading...</div>;
  }

  return (
    <div className="admin-themes">
      <header className="themes-header">
        <div className="themes-header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Manage Themes</h1>
        </div>
        <div className="themes-header-right">
          <Link to="/" className="btn-home">Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="themes-content">
        <div className="themes-actions">
          <button 
            className="btn-add"
            onClick={() => {
              setCurrentItem(null);
              setFormData({
                name: '',
                description: '',
                theme_type: 'birthday',
                category: '',
                price: '',
                demo_url: '',
                featured: false,
                preview_image: null,
                download_file: null,
                features: ''
              });
              setIsEditing(true);
            }}
            disabled={isEditing}
          >
            + Add New Theme
          </button>
        </div>

        {isEditing && (
          <div className="themes-form-container">
            <div className="themes-form">
              <h2>{currentItem ? 'Edit Theme' : 'Add New Theme'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Theme Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="theme_type">Theme Type *</label>
                    <select
                      id="theme_type"
                      name="theme_type"
                      value={formData.theme_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="birthday">Birthday</option>
                      <option value="wedding">Wedding</option>
                      <option value="event">Event</option>
                      <option value="business">Business Website</option>
                      <option value="boutique">Boutique Website</option>
                      <option value="ecommerce">Ecommerce Website</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">None</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Price *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="demo_url">Demo URL</label>
                    <input
                      type="url"
                      id="demo_url"
                      name="demo_url"
                      value={formData.demo_url}
                      onChange={handleInputChange}
                      placeholder="https://demo.example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="features">Features (one per line)</label>
                  <textarea
                    id="features"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="preview_image">Preview Image *</label>
                  <input
                    type="file"
                    id="preview_image"
                    name="preview_image"
                    accept="image/*"
                    onChange={handleInputChange}
                    required={!currentItem}
                  />
                  {currentItem && currentItem.preview_image && !formData.preview_image && (
                    <div className="current-image">
                      <img src={currentItem.preview_image} alt={currentItem.name} />
                      <p>Current preview image</p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="download_file">Download File</label>
                  <input
                    type="file"
                    id="download_file"
                    name="download_file"
                    onChange={handleInputChange}
                  />
                  {currentItem && currentItem.download_file && (
                    <p className="current-file">
                      Current file: {currentItem.download_file.split('/').pop()}
                    </p>
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

        <div className="themes-list">
          {themes.length === 0 ? (
            <div className="no-items">
              <p>No themes yet. Click "Add New Theme" to get started.</p>
            </div>
          ) : (
            <div className="themes-grid">
              {themes.map(item => (
                <div key={item.id} className="theme-card">
                  {item.preview_image && (
                    <div className="theme-image">
                      <img src={item.preview_image} alt={item.name} />
                    </div>
                  )}
                  <div className="theme-card-content">
                    <div className="theme-card-header">
                      <div>
                        <h3>{item.name}</h3>
                        <p className="theme-type">{item.theme_type_display || item.theme_type}</p>
                        {item.category_name && (
                          <p className="theme-category">{item.category_name}</p>
                        )}
                      </div>
                      {item.featured && <span className="featured-badge">Featured</span>}
                    </div>
                    <p className="theme-price">{formatPrice(item.price)}</p>
                    <p className="theme-description">
                      {item.description.length > 150 
                        ? `${item.description.substring(0, 150)}...` 
                        : item.description}
                    </p>
                    {Array.isArray(item.features) && item.features.length > 0 && (
                      <ul className="theme-features">
                        {item.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                        {item.features.length > 3 && <li>+{item.features.length - 3} more</li>}
                      </ul>
                    )}
                    {item.demo_url && (
                      <a 
                        href={item.demo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="theme-link"
                      >
                        View Demo →
                      </a>
                    )}
                    <div className="theme-card-footer">
                      <span className="theme-date">{formatDate(item.created_at)}</span>
                      <div className="theme-card-actions">
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

export default ManageThemes;
