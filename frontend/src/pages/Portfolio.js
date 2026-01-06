import React, { useState, useEffect } from 'react';
import { getPortfolioItems } from '../api/api';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await getPortfolioItems();
        setPortfolio(response.data);
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (err) {
        setError('Failed to load portfolio items');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  const filteredPortfolio = filter === 'all' 
    ? portfolio 
    : portfolio.filter(item => item.category === filter);

  return (
    <div className="portfolio-page">
      <section className="page-hero">
        <div className="container">
          <h1>Our Portfolio</h1>
          <p>Explore our collection of stunning websites and digital projects</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {categories.length > 0 && (
            <div className="portfolio-filters">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-btn ${filter === category ? 'active' : ''}`}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="loading">Loading portfolio...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredPortfolio.length > 0 ? (
            <div className="grid grid-3 portfolio-grid">
              {filteredPortfolio.map((item) => (
                <div key={item.id} className="card portfolio-item">
                  <div className="portfolio-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                    {item.featured && <span className="featured-badge">Featured</span>}
                  </div>
                  <div className="portfolio-item-content">
                    <h3>{item.title}</h3>
                    {item.category && (
                      <span className="portfolio-category">{item.category}</span>
                    )}
                    <p>{item.description}</p>
                    {item.website_url && (
                      <a 
                        href={item.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-primary"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No portfolio items found</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
