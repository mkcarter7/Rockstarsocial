import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedPortfolio, getFeaturedTestimonials, getFeaturedThemes } from '../api/api';
import './Home.css';

const Home = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfolioRes, testimonialsRes, themesRes] = await Promise.all([
          getFeaturedPortfolio(),
          getFeaturedTestimonials(),
          getFeaturedThemes(),
        ]);
        setPortfolio(portfolioRes.data.slice(0, 3));
        setTestimonials(testimonialsRes.data.slice(0, 3));
        setThemes(themesRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Transform Your Online Presence</h1>
          <p>Professional web design services and premium themes to elevate your business</p>
          <div className="hero-buttons">
            <Link to="/portfolio" className="btn btn-primary">View Our Work</Link>
            <Link to="/contact" className="btn btn-secondary">Get Started</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Portfolio</h2>
          <p className="section-subtitle">Check out some of our recent work</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : portfolio.length > 0 ? (
            <div className="grid grid-3">
              {portfolio.map((item) => (
                <div key={item.id} className="card portfolio-card">
                  <div className="portfolio-image">
                    {item.image ? (
                      <img src={item.image} alt={item.title} />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.website_url && (
                    <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      View Site
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No portfolio items available</div>
          )}
          <div className="text-center" style={{ marginTop: '30px' }}>
            <Link to="/portfolio" className="btn btn-secondary">View All Projects</Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle">Don't just take our word for it</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card testimonial-card">
                  <div className="testimonial-rating">
                    {'★'.repeat(testimonial.rating)}
                  </div>
                  <p className="testimonial-text">"{testimonial.testimonial_text}"</p>
                  <div className="testimonial-author">
                    <strong>{testimonial.client_name}</strong>
                    {testimonial.company && <span>, {testimonial.company}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No testimonials available</div>
          )}
          <div className="text-center" style={{ marginTop: '30px' }}>
            <Link to="/testimonials" className="btn btn-secondary">Read All Testimonials</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Premium Themes</h2>
          <p className="section-subtitle">Beautiful, responsive themes for your business</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : themes.length > 0 ? (
            <div className="grid grid-3">
              {themes.map((theme) => (
                <div key={theme.id} className="card theme-card">
                  <div className="theme-image">
                    {theme.preview_image ? (
                      <img src={theme.preview_image} alt={theme.name} />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                  </div>
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                  <div className="theme-meta">
                    <span className="theme-type">{theme.theme_type}</span>
                    <span className="theme-price">${theme.price}</span>
                  </div>
                  <Link to={`/themes`} className="btn btn-primary">View Details</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No themes available</div>
          )}
          <div className="text-center" style={{ marginTop: '30px' }}>
            <Link to="/themes" className="btn btn-secondary">Browse All Themes</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
