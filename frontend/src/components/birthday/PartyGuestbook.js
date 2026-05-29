'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayGuestbook, addGuestbookEntry } from '../../api/api';
import './PartyFeature.css';

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
      .then(([partyRes, gbRes]) => {
        setParty(partyRes.data);
        setEntries(gbRes.data);
        setLoading(false);
      })
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
  if (loading) return <div className="feature-loading">Loading...</div>;

  return (
    <div className="party-feature-page">
      <div className="feature-header" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        <div className="container">
          <Link href={`/birthday/${slug}`} className="back-link">← Back to Party</Link>
          <h1>📖 Guest Book</h1>
          <p>Leave a message for {party?.birthday_person_name}</p>
        </div>
      </div>

      <div className="container feature-content">
        <div className="upload-section">
          <h3>Write a Message</h3>
          {success && <div className="alert alert-success">Your message was added!</div>}
          <form onSubmit={handleSubmit} className="upload-form">
            <input
              type="text"
              placeholder="Your name *"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <textarea
              placeholder="Write your birthday message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows="4"
              required
            />
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: color }}>
              {submitting ? 'Submitting...' : 'Add to Guest Book'}
            </button>
          </form>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">No messages yet — be the first to write one!</div>
        ) : (
          <div className="guestbook-entries">
            {entries.map(entry => (
              <div key={entry.id} className="guestbook-entry">
                <div className="entry-header">
                  <strong>{entry.author_name}</strong>
                  <span className="entry-date">{new Date(entry.created_at).toLocaleDateString()}</span>
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
