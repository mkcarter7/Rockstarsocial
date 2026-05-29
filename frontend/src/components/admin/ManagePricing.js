'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../api/api';
import './ManagePricing.css';

const ManagePricing = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    popular: false
  });

  const loadPricingPlans = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/pricing/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPricingPlans(response.data);
    } catch (err) {
      console.error('Error loading pricing plans:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadPricingPlans();
  }, [loadPricingPlans]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
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
      price: item.price || '',
      features: Array.isArray(item.features) ? item.features.join('\n') : '',
      popular: item.popular || false
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      features: '',
      popular: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getIdToken();
      
      // Convert features string (newline-separated) to array
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const dataToSend = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        features: featuresArray,
        popular: formData.popular
      };

      if (isEditing && currentItem) {
        await api.put(`/admin/pricing/${currentItem.id}/`, dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await api.post('/admin/pricing/', dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      handleCancel();
      loadPricingPlans();
    } catch (err) {
      console.error('Error saving pricing plan:', err);
      alert('Error saving pricing plan. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing plan?')) {
      return;
    }
    try {
      const token = await getIdToken();
      await api.delete(`/admin/pricing/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPricingPlans(pricingPlans.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting pricing plan:', err);
      alert('Error deleting pricing plan. Please try again.');
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
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="pricing-loading">Loading...</div>;
  }

  return (
    <div className="admin-pricing">
      <header className="pricing-header">
        <div className="pricing-header-left">
          <button 
            className="btn-back"
            onClick={() => router.push('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Manage Pricing Plans</h1>
        </div>
        <div className="pricing-header-right">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="pricing-content">
        <div className="pricing-actions">
          <button 
            className="btn-add"
            onClick={() => {
              setCurrentItem(null);
              setFormData({
                name: '',
                description: '',
                price: '',
                features: '',
                popular: false
              });
              setIsEditing(true);
            }}
            disabled={isEditing}
          >
            + Add New Pricing Plan
          </button>
        </div>

        {isEditing && (
          <div className="pricing-form-container">
            <div className="pricing-form">
              <h2>{currentItem ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Plan Name *</label>
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
                    rows="4"
                    required
                  />
                </div>

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
                  <label htmlFor="features">Features (one per line) *</label>
                  <textarea
                    id="features"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    required
                  />
                  <small>Enter each feature on a new line</small>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="popular"
                      checked={formData.popular}
                      onChange={handleInputChange}
                    />
                    Mark as Popular
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

        <div className="pricing-list">
          {pricingPlans.length === 0 ? (
            <div className="no-items">
              <p>No pricing plans yet. Click "Add New Pricing Plan" to get started.</p>
            </div>
          ) : (
            <div className="pricing-grid">
              {pricingPlans.map(item => (
                <div key={item.id} className="pricing-card">
                  <div className="pricing-card-content">
                    <div className="pricing-card-header">
                      <div>
                        <h3>{item.name}</h3>
                        {item.popular && <span className="popular-badge">Popular</span>}
                      </div>
                    </div>
                    <div className="pricing-price">
                      <span className="currency">$</span>
                      <span className="amount">{item.price}</span>
                    </div>
                    <p className="pricing-description">{item.description}</p>
                    <ul className="pricing-features">
                      {item.features && item.features.map((feature, index) => (
                        <li key={index}>
                          <span className="check-icon">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="pricing-card-footer">
                      <span className="pricing-date">{formatDate(item.created_at)}</span>
                      <div className="pricing-card-actions">
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

export default ManagePricing;
