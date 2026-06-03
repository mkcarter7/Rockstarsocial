'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { checkBirthdaySlug, createBirthdayCheckout } from '../api/api';

const inputClass = "py-[10px] px-3 border border-[#ddd] rounded-[6px] text-[0.9rem] font-[inherit] outline-none focus:border-brand w-full";

const BirthdayPurchase = () => {
  const searchParams = useSearchParams();
  const themeId = searchParams.get('theme_id');

  const [form, setForm] = useState({ birthday_person_name: '', party_date: '', slug: '', host_email: '', host_name: '', password: '', confirm_password: '' });
  const [slugStatus, setSlugStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isExistingHost, setIsExistingHost] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    const email = localStorage.getItem('hostEmail');
    if (token && email) {
      setIsExistingHost(true);
      setForm(prev => ({ ...prev, host_email: email }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'slug') setSlugStatus(null);
  };

  const handleSlugBlur = async () => {
    const slug = form.slug.trim().toLowerCase();
    if (!slug) return;
    setSlugStatus('checking');
    try {
      const res = await checkBirthdaySlug(slug);
      setSlugStatus(res.data.available ? 'available' : 'taken');
    } catch {
      setSlugStatus(null);
    }
  };

  const formatSlug = (val) =>
    val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (slugStatus === 'taken') { setError('That URL is already taken. Please choose a different one.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = { ...form, slug: formatSlug(form.slug) };
      if (themeId) payload.theme_id = themeId;
      const res = await createBirthdayCheckout(payload);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>🎂 Create Your Birthday Page</h1>
          <p>Fill in the details below, then complete payment to get your page.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-[50px] max-w-[900px] mx-auto">
            <form onSubmit={handleSubmit} className="bg-white p-5 md:p-10 rounded-[12px] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
              {isExistingHost ? (
                <div className="py-3 px-4 rounded-[8px] mb-5 bg-[#fff0f7] border border-[#ff6b9d] text-[#333] text-[0.9rem]">
                  You're adding a new party to your existing account. Use your account password below.{' '}
                  <Link href="/host/dashboard" className="text-[#ff6b9d] underline">Back to dashboard</Link>
                </div>
              ) : (
                <p className="text-center mb-5 text-[0.875rem] text-[#666]">
                  Already have an account?{' '}
                  <Link href="/host/login" className="text-[#ff6b9d] underline font-semibold">Log in</Link>
                </p>
              )}

              {error && (
                <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{error}</div>
              )}

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="birthday_person_name" className="font-semibold text-black text-[0.95rem]">Birthday Person's Name *</label>
                <input type="text" id="birthday_person_name" name="birthday_person_name" value={form.birthday_person_name} onChange={handleChange} required placeholder="e.g. Kate Smith" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="party_date" className="font-semibold text-black text-[0.95rem]">Party / Birthday Date *</label>
                <input type="date" id="party_date" name="party_date" value={form.party_date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required className={inputClass} />
                <small className="text-[#666] text-[0.85rem]">Your page will be automatically deleted 60 days after this date.</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="slug" className="font-semibold text-black text-[0.95rem]">Your Page URL *</label>
                <div className="flex items-center border border-[#ddd] rounded-[6px] overflow-hidden">
                  <span className="bg-[#f5f5f5] py-[10px] px-3 text-[0.85rem] text-[#666] whitespace-nowrap border-r border-[#ddd]">
                    1rockstarsocial.com/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={form.slug}
                    onChange={(e) => handleChange({ target: { name: 'slug', value: formatSlug(e.target.value) } })}
                    onBlur={handleSlugBlur}
                    required
                    placeholder="kate-smith-birthday"
                    className="border-none flex-1 py-[10px] px-3 text-[0.9rem] outline-none"
                  />
                </div>
                {slugStatus === 'checking' && <small className="text-[#888] text-[0.85rem]">Checking availability...</small>}
                {slugStatus === 'available' && <small className="text-[#22c55e] font-semibold text-[0.85rem]">✓ Available!</small>}
                {slugStatus === 'taken' && <small className="text-[#ef4444] font-semibold text-[0.85rem]">✗ Already taken. Try a different URL.</small>}
                <small className="text-[#666] text-[0.85rem]">Only letters, numbers, and hyphens. Example: kate-smith-birthday</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="host_name" className="font-semibold text-black text-[0.95rem]">Your Name *</label>
                <input type="text" id="host_name" name="host_name" value={form.host_name} onChange={handleChange} required placeholder="Your full name" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="host_email" className="font-semibold text-black text-[0.95rem]">Your Email *</label>
                <input type="email" id="host_email" name="host_email" value={form.host_email} onChange={handleChange} required placeholder="you@email.com" className={inputClass} />
                <small className="text-[#666] text-[0.85rem]">Your receipt and party link will be sent here.</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="password" className="font-semibold text-black text-[0.95rem]">Create a Password *</label>
                <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required placeholder="At least 8 characters" className={inputClass} />
                <small className="text-[#666] text-[0.85rem]">You'll use this to log into your party dashboard later.</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="confirm_password" className="font-semibold text-black text-[0.95rem]">Confirm Password *</label>
                <input type="password" id="confirm_password" name="confirm_password" value={form.confirm_password} onChange={handleChange} required placeholder="Re-enter your password" className={inputClass} />
              </div>

              <button
                type="submit"
                className="btn btn-primary py-4 px-10 text-[1.1rem] disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading || slugStatus === 'taken'}
              >
                {loading ? 'Redirecting to payment...' : 'Continue to Payment'}
              </button>
            </form>

            <div className="bg-[#fff8ff] border-2 border-[#ff6b9d] rounded-[12px] p-[30px] h-fit sticky top-5 md:static">
              <h3 className="mb-5 text-[1.2rem] text-[#333]">What you get</h3>
              <ul className="list-none p-0 mb-[25px]">
                {['Custom URL for your birthday page', 'Photo gallery for guests', 'Guest book messages', 'RSVP tracking', 'Trivia game with leaderboard', 'Live countdown timer', 'Active for 60 days after the event'].map(item => (
                  <li key={item} className="py-2 text-[#555] border-b border-[#f0e0f0]">✓ {item}</li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-5 pt-5 border-t-2 border-[#ff6b9d]">
                <span className="text-[#666]">One-time payment</span>
                <strong className="text-[1.8rem] text-[#ff6b9d]">$29</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdayPurchase;
