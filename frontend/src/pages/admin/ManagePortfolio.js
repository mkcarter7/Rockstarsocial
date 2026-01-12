import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './ManagePortfolio.css';

const ManagePortfolio = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    website_url: '',
    category: '',
    featured: false,
    image: null
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

  useEffect(() => {
    loadPortfolioItems();
  }, [loadPortfolioItems]);

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
      title: item.title || '',
      description: item.description || '',
      website_url: item.website_url || '',
      category: item.category || '',
      featured: item.featured || false,
      image: null
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({
      title: '',
      description: '',
      website_url: '',
      category: '',
      featured: false,
      image: null
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('website_url', formData.website_url);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('featured', formData.featured);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (isEditing && currentItem) {
        await api.put(`/admin/portfolio/${currentItem.id}/`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        await api.post('/admin/portfolio/', formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      handleCancel();
      loadPortfolioItems();
    } catch (err) {
      console.error('Error saving portfolio item:', err);
      alert('Error saving portfolio item. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) {
      return;
    }
    try {
      const token = await getIdToken();
      await api.delete(`/admin/portfolio/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolioItems(portfolioItems.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      alert('Error deleting portfolio item. Please try again.');
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

  if (loading) {
    return <div className="portfolio-loading">Loading...</div>;
  }

  return (
    <div className="admin-portfolio">
      <header className="portfolio-header">
        <div className="portfolio-header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Manage Portfolio</h1>
        </div>
        <div className="portfolio-header-right">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="portfolio-content">
        <div className="portfolio-actions">
          <button 
            className="btn-add"
            onClick={() => {
              setCurrentItem(null);
              setFormData({
                title: '',
                description: '',
                website_url: '',
                category: '',
                featured: false,
                image: null
              });
              setIsEditing(true);
            }}
            disabled={isEditing}
          >
            + Add New Portfolio Item
          </button>
        </div>

        {isEditing && (
          <div className="portfolio-form-container">
            <div className="portfolio-form">
              <h2>{currentItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
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

                <div className="form-group">
                  <label htmlFor="website_url">Website URL</label>
                  <input
                    type="url"
                    id="website_url"
                    name="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Web Design, E-commerce"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Image</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                  {currentItem && currentItem.image && !formData.image && (
                    <div className="current-image">
                      <img src={currentItem.image} alt={currentItem.title} />
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

        <div className="portfolio-list">
          {portfolioItems.length === 0 ? (
            <div className="no-items">
              <p>No portfolio items yet. Click "Add New Portfolio Item" to get started.</p>
            </div>
          ) : (
            <div className="portfolio-grid">
              {portfolioItems.map(item => (
                <div key={item.id} className="portfolio-card">
                  {item.image && (
                    <div className="portfolio-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                  <div className="portfolio-card-content">
                    <div className="portfolio-card-header">
                      <h3>{item.title}</h3>
                      {item.featured && <span className="featured-badge">Featured</span>}
                    </div>
                    {item.category && (
                      <p className="portfolio-category">{item.category}</p>
                    )}
                    <p className="portfolio-description">
                      {item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...` 
                        : item.description}
                    </p>
                    {item.website_url && (
                      <a 
                        href={item.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="portfolio-link"
                      >
                        Visit Website →
                      </a>
                    )}
                    <div className="portfolio-card-footer">
                      <span className="portfolio-date">{formatDate(item.created_at)}</span>
                      <div className="portfolio-card-actions">
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

export default ManagePortfolio;
