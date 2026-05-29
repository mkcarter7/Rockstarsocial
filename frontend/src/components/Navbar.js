'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link href="/" className="navbar-logo">
            <img src="/RockStar Social Logo.png" alt="RockStar Social Logo" className="logo-image" />
            <span className="logo-text">RockStar Social</span>
          </Link>
          
          <button 
            className={`navbar-toggle ${isOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
            <li><Link href="/" onClick={() => setIsOpen(false)}>Home</Link></li>
            <li><Link href="/portfolio" onClick={() => setIsOpen(false)}>Portfolio</Link></li>
            <li><Link href="/themes" onClick={() => setIsOpen(false)}>Themes</Link></li>
            <li><Link href="/pricing" onClick={() => setIsOpen(false)}>Pricing</Link></li>
            <li><Link href="/testimonials" onClick={() => setIsOpen(false)}>Testimonials</Link></li>
            <li><Link href="/about" onClick={() => setIsOpen(false)}>About</Link></li>
            <li><Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link></li>
            <li><Link href="/admin/login" onClick={() => setIsOpen(false)} className="navbar-admin-link">Admin</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
