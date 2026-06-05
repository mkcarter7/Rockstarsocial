'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerNames, addBabyShowerName } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#d9c8bc] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c17c5a]";

const BabyShowerNames = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ suggested_name: '', suggested_by: '', note: '' });

  useEffect(() => {
    Promise.all([getBabyShower(slug), getBabyShowerNames(slug)])
      .then(([partyRes, namesRes]) => { setParty(partyRes.data); setSuggestions(namesRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.suggested_name.trim()) return;
    setSubmitting(true);
    try {
      const res = await addBabyShowerName(slug, form);
      setSuggestions(prev => [res.data, ...prev]);
      setForm({ suggested_name: '', suggested_by: '', note: '' });
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
            style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>
            💝 Baby Name Ideas
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            Help {party?.parent_names || 'the parents-to-be'} pick the perfect name
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white p-[30px] mb-10" style={{ border: '1px solid rgba(193,124,90,0.2)', boxShadow: '0 2px 16px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Suggest a Name</p>
          <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d1f0e' }}>Share Your Idea</h3>
          {success && (
            <div className="py-[15px] px-5 mb-5 font-light" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px' }}>
              Name suggestion submitted — thank you! 🍼
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Baby Name *</label>
              <input type="text" placeholder="e.g. Aurora, Theodore, River..." value={form.suggested_name}
                onChange={e => setForm(p => ({ ...p, suggested_name: e.target.value }))} required className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                Your Name <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
              </label>
              <input type="text" placeholder="So the parents know who suggested it" value={form.suggested_by}
                onChange={e => setForm(p => ({ ...p, suggested_by: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                Why this name? <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
              </label>
              <textarea placeholder="Share the meaning or story behind the name..." value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows="2" className={inputClass} />
            </div>
            <button type="submit"
              className="py-3 px-8 text-[0.85rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, color: '#fff', borderRadius: '4px' }}
              disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Name'}
            </button>
          </form>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0906e' }}>
            No name suggestions yet — be the first to share one!
          </div>
        ) : (
          <>
            <p className="text-[0.7rem] uppercase tracking-[0.25em] font-light mb-4" style={{ color: '#b0906e' }}>
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''} so far
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map(s => (
                <div key={s.id} className="bg-white p-5" style={{ border: '1px solid rgba(193,124,90,0.15)', boxShadow: '0 2px 8px rgba(100,60,20,0.06)', borderRadius: '4px' }}>
                  <p className="text-[1.2rem] font-light mb-1" style={{ color }}>{s.suggested_name}</p>
                  {s.note && <p className="text-[0.9rem] font-light italic mb-1" style={{ color: '#5a3a2a' }}>"{s.note}"</p>}
                  {s.suggested_by && (
                    <p className="text-[0.8rem] font-light" style={{ color: '#b0906e' }}>— {s.suggested_by}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BabyShowerNames;
