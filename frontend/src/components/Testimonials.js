'use client';

import React, { useState, useEffect } from 'react';
import { getTestimonials } from '../api/api';

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
    <div>
      <section className="hero">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] mt-[30px]">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card relative">
                  <div className="flex items-center gap-[15px] mb-5">
                    {testimonial.client_image ? (
                      <img
                        src={testimonial.client_image}
                        alt={testimonial.client_name}
                        className="w-[60px] h-[60px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] rounded-full bg-brand-gradient flex items-center justify-center text-white text-[1.5rem] font-bold flex-shrink-0">
                        {testimonial.client_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[1.2rem] mb-[5px] text-black">{testimonial.client_name}</h3>
                      {testimonial.client_title && (
                        <p className="text-[#718096] text-[0.9rem] mb-[3px]">{testimonial.client_title}</p>
                      )}
                      {testimonial.company && (
                        <p className="text-brand text-[0.9rem] font-medium">{testimonial.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-[#fbbf24] text-[1.3rem] mb-[15px]">
                    {'★'.repeat(testimonial.rating)}
                    <span className="text-[#718096] text-[0.9rem] ml-[10px]">({testimonial.rating}/5)</span>
                  </div>
                  <p className="italic text-[#4a5568] leading-[1.8] text-[1.05rem] mb-[15px]">"{testimonial.testimonial_text}"</p>
                  {testimonial.featured && (
                    <span className="absolute top-5 right-5 md:static md:inline-block md:mt-[15px] bg-brand text-white py-[5px] px-[15px] rounded-[20px] text-[0.85rem] font-semibold">
                      Featured
                    </span>
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
