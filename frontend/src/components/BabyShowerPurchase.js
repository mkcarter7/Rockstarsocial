'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { checkBabyShowerSlug, createBabyShowerCheckout } from '../api/api';

const TERRA = '#c17c5a';
const LINEN = '#faf6f0';

const inputClass = "py-[10px] px-3 border border-[#d9c8bc] rounded-[4px] text-[0.9rem] font-[inherit] outline-none focus:border-[#c17c5a] w-full bg-white";

const BabyShowerPurchase = () => {
  const searchParams = useSearchParams();
  const themeId = searchParams.get('theme_id');

  const [form, setForm] = useState({
    parent_names: '', shower_date: '', slug: '',
    host_email: '', host_name: '', password: '', confirm_password: '',
  });
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
      const res = await checkBabyShowerSlug(slug);
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
    if (!isExistingHost) {
      if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
      if (form.password !== form.confirm_password) { setError('Passwords do not match.'); return; }
    }
    setLoading(true);
    try {
      let payload;
      if (isExistingHost) {
        const { password, confirm_password, ...rest } = { ...form, slug: formatSlug(form.slug) };
        payload = { ...rest, session_token: localStorage.getItem('hostToken') };
      } else {
        const { confirm_password, ...rest } = { ...form, slug: formatSlug(form.slug) };
        payload = rest;
      }
      if (themeId) payload.theme_id = themeId;
      const res = await createBabyShowerCheckout(payload);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="hero" style={{ background: `linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)` }}>
        <div className="container">
          <h1 style={{ color: '#3d2414' }}>🍼 Create Your Baby Shower Page</h1>
          <p style={{ color: '#6b4332' }}>Fill in the details below, then complete payment to get your page.</p>
        </div>
      </section>

      <section className="section" style={{ background: LINEN }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-[50px] max-w-[900px] mx-auto">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-5 md:p-10"
              style={{ borderRadius: '4px', boxShadow: '0 2px 12px rgba(100,60,20,0.08)' }}
            >
              {isExistingHost ? (
                <div className="py-3 px-4 mb-5 text-[0.9rem]" style={{ background: '#fdf3ed', border: `1px solid ${TERRA}`, borderRadius: '4px', color: '#333' }}>
                  You're adding a new baby shower to your existing account.{' '}
                  <Link href="/host/dashboard" style={{ color: TERRA }} className="underline">Back to dashboard</Link>
                </div>
              ) : (
                <p className="text-center mb-5 text-[0.875rem] text-[#666]">
                  Already have an account?{' '}
                  <Link href="/host/login" className="underline font-semibold" style={{ color: TERRA }}>Log in</Link>
                </p>
              )}

              {error && (
                <div className="py-[15px] px-5 mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]" style={{ borderRadius: '4px' }}>{error}</div>
              )}

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="parent_names" className="font-semibold text-black text-[0.95rem]">Parent(s) Names *</label>
                <input type="text" id="parent_names" name="parent_names" value={form.parent_names} onChange={handleChange} required placeholder="e.g. Emma & Jake" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="shower_date" className="font-semibold text-black text-[0.95rem]">Shower Date *</label>
                <input type="date" id="shower_date" name="shower_date" value={form.shower_date} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required className={inputClass} />
                <small className="text-[#666] text-[0.85rem]">Your page will be active for 6 months after this date.</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="slug" className="font-semibold text-black text-[0.95rem]">Your Page URL *</label>
                <div className="flex items-center border border-[#d9c8bc] overflow-hidden" style={{ borderRadius: '4px' }}>
                  <span className="py-[10px] px-3 text-[0.85rem] text-[#888] whitespace-nowrap border-r border-[#d9c8bc]" style={{ background: '#f5ede6' }}>
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
                    placeholder="emma-and-jake"
                    className="border-none flex-1 py-[10px] px-3 text-[0.9rem] outline-none"
                  />
                </div>
                {slugStatus === 'checking' && <small className="text-[#888] text-[0.85rem]">Checking availability...</small>}
                {slugStatus === 'available' && <small className="text-[#22c55e] font-semibold text-[0.85rem]">✓ Available!</small>}
                {slugStatus === 'taken' && <small className="text-[#ef4444] font-semibold text-[0.85rem]">✗ Already taken. Try a different URL.</small>}
                <small className="text-[#666] text-[0.85rem]">Only letters, numbers, and hyphens. Example: emma-and-jake</small>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="host_name" className="font-semibold text-black text-[0.95rem]">Your Name *</label>
                <input type="text" id="host_name" name="host_name" value={form.host_name} onChange={handleChange} required placeholder="Your full name" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="host_email" className="font-semibold text-black text-[0.95rem]">Your Email *</label>
                <input type="email" id="host_email" name="host_email" value={form.host_email} onChange={handleChange} required placeholder="you@email.com" className={inputClass} />
                <small className="text-[#666] text-[0.85rem]">Your receipt and baby shower page link will be sent here.</small>
              </div>

              {!isExistingHost && (
                <>
                  <div className="flex flex-col gap-2 mb-5">
                    <label htmlFor="password" className="font-semibold text-black text-[0.95rem]">Create a Password *</label>
                    <input type="password" id="password" name="password" value={form.password} onChange={handleChange} required placeholder="At least 8 characters" className={inputClass} />
                    <small className="text-[#666] text-[0.85rem]">You'll use this to log into your baby shower dashboard later.</small>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    <label htmlFor="confirm_password" className="font-semibold text-black text-[0.95rem]">Confirm Password *</label>
                    <input type="password" id="confirm_password" name="confirm_password" value={form.confirm_password} onChange={handleChange} required placeholder="Re-enter your password" className={inputClass} />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="py-4 px-10 text-[1.1rem] text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed w-full"
                style={{ background: TERRA, borderRadius: '4px' }}
                disabled={loading || slugStatus === 'taken'}
              >
                {loading ? 'Redirecting to payment...' : 'Continue to Payment'}
              </button>
            </form>

            <div
              className="p-[30px] h-fit sticky top-5 md:static"
              style={{ background: LINEN, border: `2px solid ${TERRA}`, borderRadius: '4px' }}
            >
              <h3 className="mb-5 text-[1.2rem]" style={{ color: '#3d2414' }}>What you get</h3>
              <ul className="list-none p-0 mb-[25px]">
                {[
                  'Custom URL for your baby shower page',
                  'Photo gallery for guests',
                  'Guest book messages',
                  'RSVP tracking',
                  'Our Journey timeline',
                  'Gift registry',
                  'Trivia game with leaderboard',
                  'Baby name suggestions',
                  'Live countdown to the shower',
                  'Active for 6 months',
                ].map(item => (
                  <li key={item} className="py-2 text-[#555] text-[0.9rem]" style={{ borderBottom: '1px solid #e8d8cc' }}>✓ {item}</li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-5 pt-5" style={{ borderTop: `2px solid ${TERRA}` }}>
                <span className="text-[#666]">One-time payment</span>
                <strong className="text-[1.8rem]" style={{ color: TERRA }}>$39</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BabyShowerPurchase;
