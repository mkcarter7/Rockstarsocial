'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerGuestbook, addBabyShowerGuestbookEntry } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#d9c8bc] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c17c5a]";

const BabyShowerGuestbook = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getBabyShower(slug), getBabyShowerGuestbook(slug)])
      .then(([partyRes, gbRes]) => { setParty(partyRes.data); setEntries(gbRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addBabyShowerGuestbookEntry(slug, { author_name: name, message });
      setEntries(prev => [res.data, ...prev]);
      setName(''); setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : color }}>
            ← Back to Baby Shower
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>Guest Book</h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            Leave a wish for {party?.parent_names || 'the parents-to-be'}
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white p-[30px] mb-10" style={{ border: '1px solid rgba(193,124,90,0.2)', boxShadow: '0 2px 16px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Your Wishes</p>
          <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d1f0e' }}>
            Write a message for {party?.parent_names || 'the parents-to-be'}
          </h3>
          {success && (
            <div className="py-[15px] px-5 mb-5 font-light" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
              Your message has been added — thank you! 🍼
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
            <textarea placeholder="Write your wish for the growing family..." value={message} onChange={e => setMessage(e.target.value)} rows="4" required className={inputClass} />
            <button type="submit"
              className="py-3 px-8 text-[0.85rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, color: '#fff', borderRadius: '4px' }}
              disabled={submitting}>
              {submitting ? 'Submitting...' : 'Leave a Wish'}
            </button>
          </form>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0906e' }}>
            No messages yet — be the first to leave a wish!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white p-6" style={{ border: '1px solid rgba(193,124,90,0.15)', boxShadow: '0 2px 8px rgba(100,60,20,0.06)', borderRadius: '4px' }}>
                <div className="flex justify-between mb-3">
                  <strong className="font-semibold text-[0.95rem]" style={{ color: '#3d1f0e' }}>{entry.author_name}</strong>
                  <span className="text-[0.8rem] font-light" style={{ color: '#b0906e' }}>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <p className="font-light leading-relaxed m-0" style={{ color: '#5a3a2a' }}>{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyShowerGuestbook;
