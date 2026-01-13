import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolioItems, getFeaturedPortfolio, getFeaturedTestimonials } from '../api/api';
import './Home.css';
import './About.css';

const Home = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioCarousel, setPortfolioCarousel] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portfolioRes, allPortfolioRes, testimonialsRes] = await Promise.all([
          getFeaturedPortfolio(),
          getPortfolioItems(),
          getFeaturedTestimonials(),
        ]);
        setPortfolio(portfolioRes.data.slice(0, 3));
        // Filter portfolio items that have images for carousel
        const itemsWithImages = allPortfolioRes.data.filter(item => item.image);
        setPortfolioCarousel(itemsWithImages);
        setTestimonials(testimonialsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (portfolioCarousel.length === 0) return;
    
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => (prevIndex + 1) % portfolioCarousel.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [portfolioCarousel.length]);

  return (
    <div className="home">
      <section className="hero">
        <div className="container">
          <h1>Transform Your Online Presence</h1>
          <p>Professional web design services and premium themes to elevate your business</p>
          {portfolioCarousel.length > 0 && (
            <div className="hero-carousel">
              <div className="carousel-track">
                {Array.from({ length: 3 }, (_, position) => {
                  // Get the item for this position, wrapping around if needed
                  const totalItems = portfolioCarousel.length;
                  const itemIndex = (carouselIndex + position) % totalItems;
                  const item = portfolioCarousel[itemIndex];
                  
                  if (!item) return null;
                  
                  return (
                    <div 
                      key={`${item.id}-${position}-${carouselIndex}`} 
                      className="carousel-item"
                      data-position={position}
                      onClick={() => {
                        if (item.website_url) {
                          window.open(item.website_url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      style={{ cursor: item.website_url ? 'pointer' : 'default' }}
                    >
                      <img src={item.image} alt={item.title} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="hero-buttons">
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
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">Who We Are</h2>
              <p>
                RockStar Social is a leading web design agency specializing in creating 
                stunning, responsive websites and premium themes for businesses of all sizes. 
                I combine creativity with technical 
                expertise to deliver exceptional digital experiences.
              </p>
              <p>
                I work closely with clients to 
                understand their unique needs and create custom solutions that drive results. 
                Whether you need a complete website redesign, a custom Shopify theme, or a 
                ready-made template, I've got you covered.
              </p>
            </div>

            <div className="about-features">
              <h2>What We Offer</h2>
              <div className="grid grid-2 features-grid">
                <div className="feature-card">
                  <h3>Custom Web Design</h3>
                  <p>Bespoke websites tailored to your brand and business goals</p>
                </div>
                <div className="feature-card">
                  <h3>Shopify Themes</h3>
                  <p>Premium, customizable Shopify themes for your online store</p>
                </div>
                <div className="feature-card">
                  <h3>Website Templates</h3>
                  <p>Beautiful, responsive templates across various industries</p>
                </div>
                <div className="feature-card">
                  <h3>Ongoing Support</h3>
                  <p>Dedicated support to help you succeed online</p>
                </div>
              </div>
            </div>

            <div className="about-cta">
              <h2>Ready to Get Started?</h2>
              <p>Let's work together to bring your vision to life</p>
              <div className="cta-buttons">
                <Link to="/contact" className="btn btn-primary">Contact Us</Link>
                <Link to="/portfolio" className="btn btn-secondary">View Our Work</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
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
    </div>
  );
};

export default Home;
