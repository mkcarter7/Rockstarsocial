'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayGuestbook, addGuestbookEntry } from '../../api/api';

const featureInputClass = "py-[10px] px-[14px] border border-[#ddd] rounded-[6px] text-[0.95rem] font-[inherit] w-full";

const PartyGuestbook = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([getBirthdayParty(slug), getBirthdayGuestbook(slug)])
      .then(([partyRes, gbRes]) => { setParty(partyRes.data); setEntries(gbRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addGuestbookEntry(slug, { author_name: name, message });
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

  const color = party?.theme_color || '#ff6b9d';
  if (loading) return <div className="text-center py-[60px] px-5">Loading...</div>;

  return (
    <div className="min-h-screen">
      <div className="py-[50px] pb-10 text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        <div className="container">
          <Link href={`/${slug}`} className="text-[rgba(255,255,255,0.85)] no-underline text-[0.9rem] inline-block mb-[10px] hover:text-white">← Back to Party</Link>
          <h1 className="text-[2rem] my-[10px] mb-[5px] text-white">📖 Guest Book</h1>
          <p className="opacity-90 m-0">Leave a message for {party?.birthday_person_name}</p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-10">
          <h3 className="mb-5 text-[1.2rem]">Write a Message</h3>
          {success && (
            <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#c6f6d5] text-[#22543d] border border-[#9ae6b4]">Your message was added!</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required className={featureInputClass} />
            <textarea placeholder="Write your birthday message..." value={message} onChange={e => setMessage(e.target.value)} rows="4" required className={featureInputClass} />
            <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={submitting} style={{ background: color }}>
              {submitting ? 'Submitting...' : 'Add to Guest Book'}
            </button>
          </form>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-[60px] px-5 text-[#888]">No messages yet — be the first to write one!</div>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-[10px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex justify-between mb-[10px]">
                  <strong>{entry.author_name}</strong>
                  <span className="text-[#999] text-[0.85rem]">{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
                <p>{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyGuestbook;
