'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingSongRequests, submitSongRequest } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#e0d5c8] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c9a96e]";

const WeddingSongRequests = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ song_title: '', artist: '', requested_by: '' });

  useEffect(() => {
    Promise.all([getWeddingParty(slug), getWeddingSongRequests(slug)])
      .then(([partyRes, reqRes]) => {
        setParty(partyRes.data);
        setRequests(reqRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.song_title.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitSongRequest(slug, form);
      setRequests(prev => [res.data, ...prev]);
      setForm({ song_title: '', artist: '', requested_by: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // silently ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20"><p className="font-light" style={{ color: '#7a6050' }}>Loading...</p></div>;
  if (!party) return null;

  const color = party.theme_color || '#c9a96e';
  const secondaryColor = party.secondary_color || '#fdfaf7';
  const hasBanner = !!party.banner_image;
  const heroStyle = hasBanner
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' };

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      {/* Hero */}
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link
            href={`/${slug}`}
            className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : color }}
          >
            ← Back to Wedding
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]" style={{ color: hasBanner ? '#fff' : '#3d2c1e' }}>
            Song Requests
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            Help us build the perfect playlist ♪
          </p>
        </div>
      </div>

      <div className="container py-10" style={{ maxWidth: 680 }}>
        {/* Submit form */}
        <div
          className="bg-white rounded-[4px] p-[30px] mb-10"
          style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 16px rgba(201,169,110,0.08)' }}
        >
          <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Request a Song</p>
          <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d2c1e' }}>What should we play?</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Song title *"
              value={form.song_title}
              onChange={e => setForm(p => ({ ...p, song_title: e.target.value }))}
              required
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Artist (optional)"
              value={form.artist}
              onChange={e => setForm(p => ({ ...p, artist: e.target.value }))}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={form.requested_by}
              onChange={e => setForm(p => ({ ...p, requested_by: e.target.value }))}
              className={inputClass}
            />
            {success && (
              <p className="text-[0.9rem] font-light" style={{ color: '#6aaa64' }}>
                Song request submitted ♡
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || !form.song_title.trim()}
              className="py-3 px-8 text-white font-semibold text-[0.9rem] uppercase tracking-[0.1em] hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ background: color }}
            >
              {submitting ? 'Submitting…' : 'Request Song'}
            </button>
          </form>
        </div>

        {/* Request list */}
        {requests.length > 0 && (
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.25em] font-light mb-4 text-center" style={{ color }}>
              {requests.length} {requests.length === 1 ? 'request' : 'requests'} so far
            </p>
            <div className="flex flex-col gap-3">
              {requests.map(req => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 bg-white rounded-[4px] px-5 py-4"
                  style={{ border: '1px solid rgba(201,169,110,0.15)' }}
                >
                  <span className="text-[1.2rem] shrink-0" style={{ color }}>♪</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-light text-[0.95rem] truncate" style={{ color: '#3d2c1e' }}>
                      {req.song_title}
                      {req.artist && <span style={{ color: '#9a8070' }}> — {req.artist}</span>}
                    </p>
                    {req.requested_by && (
                      <p className="text-[0.75rem] font-light mt-[2px]" style={{ color: '#b0a090' }}>
                        requested by {req.requested_by}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingSongRequests;
