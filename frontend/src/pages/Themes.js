import React, { useState, useEffect } from 'react';
import { getThemes, getThemeCategories } from '../api/api';
import './Themes.css';

const Themes = () => {
  const [themes, setThemes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [themesRes, categoriesRes] = await Promise.all([
          getThemes(),
          getThemeCategories(),
        ]);
        setThemes(themesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        setError('Failed to load themes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredThemes = themes.filter(theme => {
    const typeMatch = typeFilter === 'all' || theme.theme_type === typeFilter;
    const categoryMatch = categoryFilter === 'all' || 
      (theme.category && (
        (typeof theme.category === 'object' ? theme.category.id : theme.category) === parseInt(categoryFilter)
      ));
    return typeMatch && categoryMatch;
  });

  const handlePurchase = (theme) => {
    // In a real app, this would integrate with a payment system
    alert(`Purchase functionality for "${theme.name}" would be implemented here. This would typically integrate with a payment gateway like Stripe or PayPal.`);
  };

  return (
    <div className="themes-page">
      <section className="page-hero">
        <div className="container">
          <h1>Premium Themes</h1>
          <p>Beautiful, responsive themes for Shopify and websites</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="themes-filters">
            <div className="filter-group">
              <label>Theme Type:</label>
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="birthday">Birthday</option>
                <option value="wedding">Wedding</option>
                <option value="event">Event</option>
                <option value="business">Business Website</option>
                <option value="boutique">Boutique Website</option>
                <option value="ecommerce">Ecommerce Website</option>
              </select>
            </div>
            
            {categories.length > 0 && (
              <div className="filter-group">
                <label>Category:</label>
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">Loading themes...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredThemes.length > 0 ? (
            <div className="grid grid-3 themes-grid">
              {filteredThemes.map((theme) => (
                <div key={theme.id} className="card theme-item">
                  <div className="theme-item-image">
                    {theme.preview_image ? (
                      <img src={theme.preview_image} alt={theme.name} />
                    ) : (
                      <div className="placeholder-image">No Preview</div>
                    )}
                    {theme.featured && (
                      <span className="featured-badge">Featured</span>
                    )}
                  </div>
                  <div className="theme-item-content">
                    <div className="theme-header">
                      <h3>{theme.name}</h3>
                      <span className="theme-type-badge">{theme.theme_type_display || theme.theme_type}</span>
                    </div>
                    {theme.category_name && (
                      <span className="theme-category">{theme.category_name}</span>
                    )}
                    <p className="theme-description">{theme.description}</p>
                    {theme.features && theme.features.length > 0 && (
                      <ul className="theme-features">
                        {theme.features.slice(0, 3).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    )}
                    <div className="theme-footer">
                      <div className="theme-price">${theme.price}</div>
                      <div className="theme-actions">
                        {theme.demo_url && (
                          <a 
                            href={theme.demo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                          >
                            Demo
                          </a>
                        )}
                        <button 
                          onClick={() => handlePurchase(theme)}
                          className="btn btn-primary"
                        >
                          Purchase
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No themes found</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Themes;
