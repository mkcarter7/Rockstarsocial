'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingRSVP, submitWeddingRSVP } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#e0d5c8] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c9a96e]";

const WeddingRSVP = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', status: 'yes', guest_count: 1, message: '' });

  useEffect(() => {
    Promise.all([getWeddingParty(slug), getWeddingRSVP(slug)])
      .then(([partyRes, rsvpRes]) => { setParty(partyRes.data); setRsvpData(rsvpRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitWeddingRSVP(slug, form);
      const res = await getWeddingRSVP(slug);
      setRsvpData(res.data);
      setSubmitted(true);
    } catch {
      alert('Failed to submit RSVP. Please try again.');
    }
    setSubmitting(false);
  };

  const color = party?.theme_color || '#c9a96e';
  const secondaryColor = party?.secondary_color || '#fdfaf7';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a6050' }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#c9a96e' }}>
            ← Back to Wedding
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d2c1e' }}>
            RSVP
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            Will you be joining {party?.couple_name || 'the couple'} to celebrate?
          </p>
        </div>
      </div>

      <div className="container py-10">
        {rsvpData && (
          <div className="flex gap-5 mb-10 flex-wrap">
            {[
              { count: rsvpData.yes, label: 'Attending', highlight: true },
              { count: rsvpData.maybe, label: 'Maybe', highlight: false },
              { count: rsvpData.no, label: "Unable to Attend", highlight: false },
            ].map(({ count, label, highlight }) => (
              <div key={label} className="flex-1 min-w-[100px] bg-white rounded-[4px] p-5 text-center"
                style={{ border: highlight ? `1px solid ${color}` : '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 8px rgba(201,169,110,0.06)' }}>
                <span className="block text-[2.5rem] font-light" style={{ color: highlight ? color : '#b0a090' }}>{count}</span>
                <span className="text-[0.75rem] uppercase tracking-[0.15em] font-light" style={{ color: '#7a6050' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {submitted ? (
          <div className="py-5 px-6 rounded-[4px] mb-5 text-[1rem] font-light"
            style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
            Thank you for your RSVP — we hope to see you there ♡
          </div>
        ) : (
          <div className="bg-white rounded-[4px] p-[30px] mb-10" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 16px rgba(201,169,110,0.08)' }}>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Your Reply</p>
            <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d2c1e' }}>Submit Your RSVP</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Your name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
              <input type="email" placeholder="Your email (optional)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
              <div className="flex gap-[10px] flex-wrap">
                {[
                  { val: 'yes', label: 'Joyfully Accepts' },
                  { val: 'maybe', label: 'Possibly' },
                  { val: 'no', label: 'Regretfully Declines' },
                ].map(({ val, label }) => (
                  <button key={val} type="button"
                    className="flex-1 min-w-[140px] py-3 rounded-[4px] font-light text-[0.85rem] uppercase tracking-[0.1em] cursor-pointer bg-white transition-all duration-200"
                    style={form.status === val
                      ? { background: color, border: `1px solid ${color}`, color: '#fff' }
                      : { border: `1px solid ${color}60`, color }}
                    onClick={() => setForm(p => ({ ...p, status: val }))}>
                    {label}
                  </button>
                ))}
              </div>
              {form.status === 'yes' && (
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Number of guests (including yourself)</label>
                  <input type="number" min="1" max="20" value={form.guest_count} onChange={e => setForm(p => ({ ...p, guest_count: parseInt(e.target.value) }))} className={inputClass} />
                </div>
              )}
              <textarea placeholder="A note for the couple (optional)" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows="3" className={inputClass} />
              <button type="submit"
                className="py-3 px-8 text-[0.85rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: color, color: '#fff' }}
                disabled={submitting}>
                {submitting ? 'Submitting...' : 'Send RSVP'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingRSVP;
