'use client';

import React, { useState } from 'react';
import { submitContact } from '../api/api';

const inputClass = "py-3 px-[15px] border-2 border-[#e2e8f0] rounded-[5px] text-base font-[inherit] transition-colors duration-300 outline-none focus:border-brand";

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await submitContact(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>Get In Touch</h1>
          <p>Have a project in mind? We'd love to hear from you</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-[30px] md:gap-[50px] max-w-[1200px] mx-auto">
            <div>
              <h2 className="text-[2rem] md:text-[1.5rem] mb-[30px] text-black">Contact Information</h2>
              <div className="mb-[30px]">
                <h3 className="text-[1.2rem] text-brand mb-[10px]">Email</h3>
                <p className="text-[#718096] leading-[1.8] mb-[5px]">1rockstarsocial@gmail.com</p>
              </div>
              <div className="mb-[30px]">
                <h3 className="text-[1.2rem] text-brand mb-[10px]">Phone</h3>
                <p className="text-[#718096] leading-[1.8] mb-[5px]">931-212-3154</p>
              </div>
            </div>

            <div className="bg-white p-10 md:p-[25px] rounded-[10px] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
              <h2 className="text-[2rem] md:text-[1.5rem] mb-[30px] text-black">Send Us a Message</h2>
              {success && (
                <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#c6f6d5] text-[#22543d] border border-[#9ae6b4]">
                  Thank you for your message! We will get back to you soon.
                </div>
              )}
              {error && (
                <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="font-semibold text-black text-[0.95rem]">Name *</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Your name" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="font-semibold text-black text-[0.95rem]">Email *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your.email@example.com" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="font-semibold text-black text-[0.95rem]">Phone</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="subject" className="font-semibold text-black text-[0.95rem]">Subject *</label>
                  <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="What is this regarding?" className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="message" className="font-semibold text-black text-[0.95rem]">Message *</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="6" placeholder="Tell us about your project..." className={`${inputClass} resize-y min-h-[120px]`} />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary py-[15px] px-[30px] text-[1.1rem] w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
