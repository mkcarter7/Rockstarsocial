import React, { useState, useEffect } from 'react';
import { getPricingPlans } from '../api/api';
import { Link } from 'react-router-dom';
import './Pricing.css';

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await getPricingPlans();
        setPlans(response.data);
      } catch (err) {
        setError('Failed to load pricing plans');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  return (
    <div className="pricing-page">
      <section className="page-hero">
        <div className="container">
          <h1>Pricing Plans</h1>
          <p>Choose the perfect plan for your business needs</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading pricing plans...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : plans.length > 0 ? (
            <div className="pricing-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`card pricing-card ${plan.popular ? 'popular' : ''}`}
                >
                  {plan.popular && (
                    <div className="popular-badge">Most Popular</div>
                  )}
                  <h3>{plan.name}</h3>
                  <div className="pricing-price">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price}</span>
                  </div>
                  <p className="pricing-description">{plan.description}</p>
                  <ul className="pricing-features">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index}>
                        <span className="check-icon">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact" className="btn btn-primary pricing-btn">
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No pricing plans available</div>
          )}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="pricing-cta">
            <h2>Need a Custom Solution?</h2>
            <p>We can create a tailored package that fits your specific requirements</p>
            <Link to="/contact" className="btn btn-primary">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
