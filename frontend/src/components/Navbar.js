'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/themes', label: 'Themes' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 no-underline">
            <img
              src="/RockStar Social Logo.png"
              alt="RockStar Social Logo"
              className="h-10 w-auto object-contain"
            />
            <span
              className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #fab3c2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              RockStar Social
            </span>
          </Link>

          {/* Desktop menu */}
          <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-black font-medium py-2 hover:text-brand transition-colors duration-300 no-underline"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin/login"
                className="text-brand font-semibold border border-brand px-4 py-2 rounded hover:bg-brand hover:text-white transition-all duration-300 no-underline"
              >
                Admin
              </Link>
            </li>
          </ul>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 bg-transparent border-none p-1 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 rounded ${
                isOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 rounded ${
                isOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 rounded ${
                isOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <ul className="md:hidden list-none m-0 p-0 pb-4 flex flex-col">
            {links.map(({ href, label }) => (
              <li key={href} className="border-b border-gray-100">
                <Link
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className="block py-4 text-center text-black font-medium hover:text-brand transition-colors duration-300 no-underline"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="pt-3 text-center">
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className="inline-block text-brand font-semibold border border-brand px-4 py-2 rounded hover:bg-brand hover:text-white transition-all duration-300 no-underline"
              >
                Admin
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
