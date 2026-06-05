import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black text-white pt-8 md:pt-[50px] pb-5 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-6 md:mb-10">
          <div>
            <h3 className="text-[1.5rem] mb-[15px] text-brand">RockStar Social</h3>
            <p className="text-[#a0aec0] leading-[1.8] mb-[10px]">Professional web design services and premium themes for your business.</p>
          </div>

          <div>
            <h4 className="text-[1.1rem] mb-[15px] text-[#cbd5e0]">Quick Links</h4>
            <ul className="list-none">
              <li className="mb-[10px]"><Link href="/" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">Home</Link></li>
              <li className="mb-[10px]"><Link href="/portfolio" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">Portfolio</Link></li>
              <li className="mb-[10px]"><Link href="/shop" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">Shop</Link></li>

            </ul>
          </div>

          <div>
            <h4 className="text-[1.1rem] mb-[15px] text-[#cbd5e0]">Company</h4>
            <ul className="list-none">
              <li className="mb-[10px]"><Link href="/about" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">About Us</Link></li>
              <li className="mb-[10px]"><Link href="/testimonials" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">Testimonials</Link></li>
              <li className="mb-[10px]"><Link href="/contact" className="text-[#a0aec0] transition-colors duration-300 ease hover:text-brand">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[1.1rem] mb-[15px] text-[#cbd5e0]">Contact</h4>
            <p className="text-[#a0aec0] leading-[1.8] mb-[10px]">Email: 1rockstarsocial@gmail.com</p>
            <p className="text-[#a0aec0] leading-[1.8] mb-[10px]">Phone: 931-212-3154</p>
          </div>
        </div>

        <div className="text-center pt-5 border-t border-[#333] text-[#ccc]">
          <p>&copy; {new Date().getFullYear()} RockStar Social. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
