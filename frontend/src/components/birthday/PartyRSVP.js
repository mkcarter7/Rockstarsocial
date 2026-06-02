'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayRSVP, submitBirthdayRSVP } from '../../api/api';

const featureInputClass = "py-[10px] px-[14px] border border-[#ddd] rounded-[6px] text-[0.95rem] font-[inherit] w-full";

const PartyRSVP = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', status: 'yes', guest_count: 1, message: '' });

  useEffect(() => {
    Promise.all([getBirthdayParty(slug), getBirthdayRSVP(slug)])
      .then(([partyRes, rsvpRes]) => { setParty(partyRes.data); setRsvpData(rsvpRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitBirthdayRSVP(slug, form);
      const res = await getBirthdayRSVP(slug);
      setRsvpData(res.data);
      setSubmitted(true);
    } catch {
      alert('Failed to submit RSVP. Please try again.');
    }
    setSubmitting(false);
  };

  const color = party?.theme_color || '#ff6b9d';
  const secondaryColor = party?.secondary_color || '#ffffff';
  if (loading) return <div className="text-center py-[60px] px-5">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[50px] pb-10 text-white" style={{ background: color }}>
        <div className="container">
          <Link href={`/${slug}`} className="text-[rgba(255,255,255,0.85)] no-underline text-[0.9rem] inline-block mb-[10px] hover:text-white">← Back to Party</Link>
          <h1 className="text-[2rem] my-[10px] mb-[5px] text-white">✅ RSVP</h1>
          <p className="opacity-90 m-0">Will you be at {party?.birthday_person_name}'s celebration?</p>
        </div>
      </div>

      <div className="container py-10">
        {rsvpData && (
          <div className="flex gap-5 mb-10 flex-wrap">
            {[
              { count: rsvpData.yes, label: 'Attending', highlight: true },
              { count: rsvpData.maybe, label: 'Maybe', highlight: false },
              { count: rsvpData.no, label: "Can't Make It", highlight: false },
            ].map(({ count, label, highlight }) => (
              <div key={label} className="flex-1 min-w-[100px] bg-white border-2 border-[#ddd] rounded-[12px] p-5 text-center" style={highlight ? { borderColor: color } : {}}>
                <span className="block text-[2.5rem] font-bold text-[#333]" style={highlight ? { color } : {}}>{count}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {submitted ? (
          <div className="py-[15px] px-5 rounded-[5px] mb-5 text-[1.1rem] bg-[#c6f6d5] text-[#22543d] border border-[#9ae6b4]">
            Thanks for your RSVP! See you there 🎉
          </div>
        ) : (
          <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-10">
            <h3 className="mb-5 text-[1.2rem]">Your RSVP</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" placeholder="Your name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className={featureInputClass} />
              <input type="email" placeholder="Your email (optional)" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={featureInputClass} />
              <div className="flex gap-[10px] flex-wrap">
                {['yes', 'maybe', 'no'].map(s => (
                  <button
                    key={s}
                    type="button"
                    className="flex-1 min-w-[120px] py-3 border-2 rounded-[8px] font-semibold cursor-pointer bg-white transition-all duration-200"
                    style={form.status === s ? { background: color, borderColor: color, color: 'white' } : { borderColor: color, color }}
                    onClick={() => setForm(p => ({ ...p, status: s }))}
                  >
                    {s === 'yes' ? '✓ Attending' : s === 'maybe' ? '? Maybe' : "✗ Can't Make It"}
                  </button>
                ))}
              </div>
              {form.status === 'yes' && (
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-black">Number of guests (including yourself)</label>
                  <input type="number" min="1" max="20" value={form.guest_count} onChange={e => setForm(p => ({ ...p, guest_count: parseInt(e.target.value) }))} className={featureInputClass} />
                </div>
              )}
              <textarea placeholder="Note for the host (optional)" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows="3" className={featureInputClass} />
              <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={submitting} style={{ background: color }}>
                {submitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyRSVP;
