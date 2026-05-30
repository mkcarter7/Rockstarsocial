'use client';

import React, { useState } from 'react';
import { checkBirthdaySlug, createBirthdayCheckout } from '../api/api';
import './BirthdayPurchase.css';

const BirthdayPurchase = () => {
  const [form, setForm] = useState({
    birthday_person_name: '',
    party_date: '',
    slug: '',
    host_email: '',
    host_name: '',
  });
  const [slugStatus, setSlugStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const res = await checkBirthdaySlug(slug);
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

    if (slugStatus === 'taken') {
      setError('That URL is already taken. Please choose a different one.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, slug: formatSlug(form.slug) };
      const res = await createBirthdayCheckout(payload);
      window.location.href = res.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="birthday-purchase-page">
      <section className="page-hero">
        <div className="container">
          <h1>🎂 Create Your Birthday Page</h1>
          <p>Fill in the details below, then complete payment to get your page.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="birthday-purchase-layout">
            <form onSubmit={handleSubmit} className="birthday-purchase-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="birthday_person_name">Birthday Person's Name *</label>
                <input
                  type="text"
                  id="birthday_person_name"
                  name="birthday_person_name"
                  value={form.birthday_person_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Kate Smith"
                />
              </div>

              <div className="form-group">
                <label htmlFor="party_date">Party / Birthday Date *</label>
                <input
                  type="date"
                  id="party_date"
                  name="party_date"
                  value={form.party_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <small>Your page will be automatically deleted 60 days after this date.</small>
              </div>

              <div className="form-group">
                <label htmlFor="slug">Your Page URL *</label>
                <div className="slug-input-wrapper">
                  <span className="slug-prefix">1rockstarsocial.com/birthday/</span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={form.slug}
                    onChange={(e) => handleChange({ target: { name: 'slug', value: formatSlug(e.target.value) } })}
                    onBlur={handleSlugBlur}
                    required
                    placeholder="kate-smith-birthday"
                  />
                </div>
                {slugStatus === 'checking' && <small className="slug-checking">Checking availability...</small>}
                {slugStatus === 'available' && <small className="slug-available">✓ Available!</small>}
                {slugStatus === 'taken' && <small className="slug-taken">✗ Already taken. Try a different URL.</small>}
                <small>Only letters, numbers, and hyphens. Example: kate-smith-birthday</small>
              </div>

              <div className="form-group">
                <label htmlFor="host_name">Your Name *</label>
                <input
                  type="text"
                  id="host_name"
                  name="host_name"
                  value={form.host_name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="host_email">Your Email *</label>
                <input
                  type="email"
                  id="host_email"
                  name="host_email"
                  value={form.host_email}
                  onChange={handleChange}
                  required
                  placeholder="you@email.com"
                />
                <small>Your receipt and party link will be sent here.</small>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-large"
                disabled={loading || slugStatus === 'taken'}
              >
                {loading ? 'Redirecting to payment...' : 'Continue to Payment — $29'}
              </button>
            </form>

            <div className="birthday-purchase-summary">
              <h3>What you get</h3>
              <ul>
                <li>✓ Custom URL for your birthday page</li>
                <li>✓ Photo gallery for guests</li>
                <li>✓ Guest book messages</li>
                <li>✓ RSVP tracking</li>
                <li>✓ Trivia game with leaderboard</li>
                <li>✓ Live countdown timer</li>
                <li>✓ Active for 60 days after the event</li>
              </ul>
              <div className="purchase-price">
                <span>One-time payment</span>
                <strong>$29</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdayPurchase;
