import React from 'react';
import Link from 'next/link';

const About = () => {
  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>About RockStar Social</h1>
          <p>Your trusted partner in web design and digital solutions</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="max-w-[1000px] mx-auto">
            <div className="mb-8 md:mb-[60px]">
              <h2 className="text-[1.6rem] md:text-[2rem] lg:text-[2.5rem] mb-5 text-black">Who We Are</h2>
              <p className="text-base md:text-[1.1rem] text-[#4a5568] leading-[1.8] mb-5">
                RockStar Social is a leading web design agency specializing in creating
                stunning, responsive websites and premium themes for businesses of all sizes.
                I combine creativity with technical expertise to deliver exceptional digital experiences.
              </p>
              <p className="text-base md:text-[1.1rem] text-[#4a5568] leading-[1.8] mb-5">
                I work closely with clients to understand their unique needs and create custom solutions that drive results.
                Whether you need a complete website redesign, a custom Shopify theme, or a
                ready-made template, I've got you covered.
              </p>
            </div>

            <div className="mb-8 md:mb-[60px]">
              <h2 className="text-[1.6rem] md:text-[2rem] lg:text-[2.5rem] mb-5 md:mb-10 text-center text-black">What We Offer</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px] mt-[30px]">
                {[
                  { title: 'Custom Web Design', desc: 'Bespoke websites tailored to your brand and business goals' },
                  { title: 'Shopify Themes', desc: 'Premium, customizable Shopify themes for your online store' },
                  { title: 'Website Templates', desc: 'Beautiful, responsive templates across various industries' },
                  { title: 'Ongoing Support', desc: 'Dedicated support to help you succeed online' },
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
              <div className="flex gap-5 justify-center flex-wrap md:flex-col md:items-center">
                <Link href="/contact" className="btn btn-primary md:w-full md:max-w-[300px]">Contact Us</Link>
                <Link href="/portfolio" className="btn btn-secondary md:w-full md:max-w-[300px]">View Our Work</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
