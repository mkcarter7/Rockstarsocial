'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingGuestbook, addWeddingGuestbookEntry } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#e0d5c8] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c9a96e]";

const WeddingGuestbook = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getWeddingParty(slug), getWeddingGuestbook(slug)])
      .then(([partyRes, gbRes]) => { setParty(partyRes.data); setEntries(gbRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addWeddingGuestbookEntry(slug, { author_name: name, message });
      setEntries(prev => [res.data, ...prev]);
      setName('');
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert('Failed to submit. Please try again.');
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
          <Link href={`/w/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#c9a96e' }}>
            ← Back to Wedding
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d2c1e' }}>
            Guest Book
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            Leave a wish for {party?.couple_name || 'the happy couple'}
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white rounded-[4px] p-[30px] mb-10" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 16px rgba(201,169,110,0.08)' }}>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Your Wishes</p>
          <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d2c1e' }}>Write a Message</h3>
          {success && (
            <div className="py-[15px] px-5 rounded-[4px] mb-5 font-light" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
              Your message has been added — thank you! ♡
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
            <textarea placeholder="Write your message for the couple..." value={message} onChange={e => setMessage(e.target.value)} rows="4" required className={inputClass} />
            <button type="submit"
              className="py-3 px-8 text-[0.85rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, color: '#fff' }}
              disabled={submitting}>
              {submitting ? 'Submitting...' : 'Leave a Wish'}
            </button>
          </form>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0a090' }}>
            No messages yet — be the first to leave a wish!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-[4px] p-6" style={{ border: '1px solid rgba(201,169,110,0.15)', boxShadow: '0 2px 8px rgba(201,169,110,0.06)' }}>
                <div className="flex justify-between mb-3">
                  <strong className="font-semibold text-[0.95rem]" style={{ color: '#3d2c1e' }}>{entry.author_name}</strong>
                  <span className="text-[0.8rem] font-light" style={{ color: '#b0a090' }}>{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <p className="font-light leading-relaxed m-0" style={{ color: '#5a3e2b' }}>{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingGuestbook;
