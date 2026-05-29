'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayRSVP, submitBirthdayRSVP } from '../../api/api';
import './PartyFeature.css';

const PartyRSVP = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [rsvpData, setRsvpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', status: 'yes', guest_count: 1, message: '' });

  useEffect(() => {
    Promise.all([getBirthdayParty(slug), getBirthdayRSVP(slug)])
      .then(([partyRes, rsvpRes]) => {
        setParty(partyRes.data);
        setRsvpData(rsvpRes.data);
        setLoading(false);
      })
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
  if (loading) return <div className="feature-loading">Loading...</div>;

  return (
    <div className="party-feature-page">
      <div className="feature-header" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        <div className="container">
          <Link href={`/birthday/${slug}`} className="back-link">← Back to Party</Link>
          <h1>✅ RSVP</h1>
          <p>Will you be at {party?.birthday_person_name}'s celebration?</p>
        </div>
      </div>

      <div className="container feature-content">
        {rsvpData && (
          <div className="rsvp-summary">
            <div className="rsvp-stat" style={{ borderColor: color }}>
              <span className="rsvp-number" style={{ color }}>{rsvpData.yes}</span>
              <span>Attending</span>
            </div>
            <div className="rsvp-stat">
              <span className="rsvp-number">{rsvpData.maybe}</span>
              <span>Maybe</span>
            </div>
            <div className="rsvp-stat">
              <span className="rsvp-number">{rsvpData.no}</span>
              <span>Can't Make It</span>
            </div>
          </div>
        )}

        {submitted ? (
          <div className="alert alert-success rsvp-success">
            Thanks for your RSVP! See you there 🎉
          </div>
        ) : (
          <div className="upload-section">
            <h3>Your RSVP</h3>
            <form onSubmit={handleSubmit} className="upload-form">
              <input
                type="text"
                placeholder="Your name *"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Your email (optional)"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
              <div className="rsvp-status-buttons">
                {['yes', 'maybe', 'no'].map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`rsvp-status-btn ${form.status === s ? 'active' : ''}`}
                    style={form.status === s ? { background: color, borderColor: color, color: 'white' } : { borderColor: color, color }}
                    onClick={() => setForm(p => ({ ...p, status: s }))}
                  >
                    {s === 'yes' ? '✓ Attending' : s === 'maybe' ? '? Maybe' : '✗ Can\'t Make It'}
                  </button>
                ))}
              </div>
              {form.status === 'yes' && (
                <div className="form-group">
                  <label>Number of guests (including yourself)</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.guest_count}
                    onChange={e => setForm(p => ({ ...p, guest_count: parseInt(e.target.value) }))}
                  />
                </div>
              )}
              <textarea
                placeholder="Note for the host (optional)"
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                rows="3"
              />
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: color }}>
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
