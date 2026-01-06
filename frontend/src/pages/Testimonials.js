import React, { useState, useEffect } from 'react';
import { getTestimonials } from '../api/api';
import './Testimonials.css';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await getTestimonials();
        setTestimonials(response.data);
      } catch (err) {
        setError('Failed to load testimonials');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div className="testimonials-page">
      <section className="page-hero">
        <div className="container">
          <h1>Client Testimonials</h1>
          <p>Hear what our clients have to say about working with us</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading testimonials...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-2 testimonials-grid">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card testimonial-item">
                  <div className="testimonial-header">
                    {testimonial.client_image ? (
                      <img 
                        src={testimonial.client_image} 
                        alt={testimonial.client_name}
                        className="testimonial-avatar"
                      />
                    ) : (
                      <div className="testimonial-avatar-placeholder">
                        {testimonial.client_name.charAt(0)}
                      </div>
                    )}
                    <div className="testimonial-info">
                      <h3>{testimonial.client_name}</h3>
                      {testimonial.client_title && (
                        <p className="testimonial-title">{testimonial.client_title}</p>
                      )}
                      {testimonial.company && (
                        <p className="testimonial-company">{testimonial.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="testimonial-rating">
                    {'★'.repeat(testimonial.rating)}
                    <span className="rating-text">({testimonial.rating}/5)</span>
                  </div>
                  <p className="testimonial-text">"{testimonial.testimonial_text}"</p>
                  {testimonial.featured && (
                    <span className="featured-badge">Featured</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No testimonials available</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Testimonials;
