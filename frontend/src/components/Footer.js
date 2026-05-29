import React from 'react';
import Link from 'next/link';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>RockStar Social</h3>
            <p>Professional web design services and premium themes for your business.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/portfolio">Portfolio</Link></li>
              <li><Link href="/themes">Themes</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/testimonials">Testimonials</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: 1rockstarsocial@gmail.com</p>
            <p>Phone: 931-212-3154</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} RockStar Social. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
