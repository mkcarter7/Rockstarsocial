import React from 'react';
import Link from 'next/link';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <section className="page-hero">
        <div className="container">
          <h1>About RockStar Social</h1>
          <p>Your trusted partner in web design and digital solutions</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2>Who We Are</h2>
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
                <Link href="/contact" className="btn btn-primary">Contact Us</Link>
                <Link href="/portfolio" className="btn btn-secondary">View Our Work</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;


