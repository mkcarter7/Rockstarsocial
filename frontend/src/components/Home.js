'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPortfolioItems, getFeaturedPortfolio, getFeaturedTestimonials } from '../api/api';

const Home = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [carouselItems, setCarouselItems] = useState([]);
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

        const portfolioItems = allPortfolioRes.data
          .filter(item => item.image)
          .map(item => ({ id: `portfolio-${item.id}`, image: item.image, url: item.website_url, title: item.title, type: 'portfolio' }));

        setCarouselItems(portfolioItems);
        setTestimonials(testimonialsRes.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (carouselItems.length === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Transform Your Online Presence</h1>
          <p>Professional web design services and premium designs to elevate your business</p>

          {carouselItems.length > 0 && (
            /* hero-carousel class kept for ::before arc pseudo-element defined in App.css */
            <div className="hero-carousel mt-8 mb-6 h-[110px] relative overflow-hidden flex justify-center items-center py-3 px-4 md:h-[180px] md:mt-10 md:mb-8 md:py-5 md:px-5 lg:h-[350px] lg:mt-[60px] lg:mb-10 lg:overflow-visible lg:py-10 lg:px-5">
              <div className="carousel-track relative w-full h-full flex justify-center items-center gap-3 z-[1] md:gap-4 lg:gap-[30px]">
                {Array.from({ length: 3 }, (_, position) => {
                  const totalItems = carouselItems.length;
                  const itemIndex = (carouselIndex + position) % totalItems;
                  const item = carouselItems[itemIndex];
                  if (!item) return null;
                  return (
                    /* carousel-item class kept for nth-child media rules in App.css */
                    <div
                      key={`${item.id}-${position}-${carouselIndex}`}
                      className="carousel-item relative w-[90px] h-[90px] rounded-[12px] overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.2)] transition-all duration-[800ms] bg-white flex-shrink-0 hover:z-10 md:w-[130px] md:h-[130px] lg:w-[280px] lg:h-[280px] lg:shadow-[0_10px_30px_rgba(0,0,0,0.3)] lg:hover:-translate-y-[10px] lg:hover:scale-105 lg:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                      onClick={() => { if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer'); }}
                      style={{ cursor: item.url ? 'pointer' : 'default' }}
                    >
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover block" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-5 justify-center flex-wrap md:flex-col md:items-center">
            <Link href="/contact" className="btn btn-secondary md:w-full md:max-w-[300px]">Get Started</Link>
            <Link href="/portfolio" className="btn btn-primary md:w-full md:max-w-[300px]">View Portfolio</Link>
          </div>
        </div>
      </section>

      {/* Featured Portfolio */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Featured Portfolio</h2>
          <p className="section-subtitle">Check out some of our recent work</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
              {portfolio.map((item) => (
                <div key={item.id} className="card text-center">
                  <div className="w-full h-[200px] overflow-hidden rounded-[8px] mb-5 bg-[#e2e8f0] relative">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#666] text-[1.1rem]">No Image</div>
                    )}
                  </div>
                  <h3 className="text-[1.3rem] mb-[10px] text-black">{item.title}</h3>
                  <p className="text-[#333] mb-5 leading-relaxed">{item.description}</p>
                  {item.website_url && (
                    <a href={item.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">View Site</a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No portfolio items available</div>
          )}
          <div className="text-center mt-[30px]">
            <Link href="/portfolio" className="btn btn-secondary">View All Projects</Link>
          </div>
        </div>
      </section>

      {/* About / Features */}
      <section className="section bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8]">
        <div className="container">
          <div className="max-w-[1000px] mx-auto">
            <div className="mb-8 md:mb-[60px]">
              <h2 className="section-title">Who We Are</h2>
              <p className="text-base md:text-[1.1rem] text-[#4a5568] leading-[1.8] mb-5">
                RockStar Social is a small business specializing in creating
                stunning, responsive websites and premium themes for businesses of all sizes.
                I combine creativity with technical expertise to deliver exceptional digital experiences.
              </p>
              <p className="text-base md:text-[1.1rem] text-[#4a5568] leading-[1.8] mb-5">
                I work closely with clients to understand their unique needs and create custom solutions that drive results.
                Whether you need a complete website redesign, a custom Shopify theme, or a ready-made template, I've got you covered.
              </p>
            </div>

            <div className="mb-8 md:mb-[60px]">
              <h2 className="text-[1.6rem] md:text-[2rem] lg:text-[2.5rem] mb-5 md:mb-10 text-black">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] mt-[30px]">
                {[
                  { title: 'Custom Web Design', desc: 'Bespoke websites tailored to your brand and business goals' },
                  { title: 'Shopify Themes', desc: 'Premium, customizable Shopify themes for your online store' },
                  { title: 'Website Templates', desc: 'Beautiful, responsive templates across various industries' },
                  { title: 'Support', desc: 'Hourly Technical Support and dedicated ongoing support to help you succeed online' },
                ].map(({ title, desc }) => (
                  <div key={title} className="card">
                    <h3 className="text-[1.5rem] mb-[15px] text-brand">{title}</h3>
                    <p className="text-[#718096] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-8 px-4 md:py-[60px] md:px-5 bg-[#f7fafc] rounded-[10px]">
              <h2 className="text-[1.6rem] md:text-[2rem] lg:text-[2.5rem] mb-[15px] text-black">Ready to Get Started?</h2>
              <p className="text-base md:text-[1.2rem] text-[#333] mb-[30px]">Let's work together to bring your vision to life</p>
              <div className="flex gap-5 justify-center flex-wrap">
                <Link href="/contact" className="btn btn-primary">Contact Us</Link>
                <Link href="/portfolio" className="btn btn-secondary">View Our Work</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">What Our Clients Say</h2>
          <p className="section-subtitle">Don't just take our word for it</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px]">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="card text-center">
                  <div className="text-[#fbbf24] text-[1.5rem] mb-[15px]">{'★'.repeat(testimonial.rating)}</div>
                  <p className="italic text-[#333] mb-5 leading-[1.8] text-[1.1rem]">"{testimonial.testimonial_text}"</p>
                  <div className="text-black text-[0.95rem]">
                    <strong>{testimonial.client_name}</strong>
                    {testimonial.company && <span>, {testimonial.company}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="loading">No testimonials available</div>
          )}
          <div className="text-center mt-[30px]">
            <Link href="/testimonials" className="btn btn-secondary">Read All Testimonials</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
