'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBirthdaySetup, saveBirthdaySetup } from '../api/api';
import './BirthdaySetup.css';

const BirthdaySetup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [themeColor, setThemeColor] = useState('#ff6b9d');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bannerImage, setBannerImage] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please complete payment first.');
      setLoading(false);
      return;
    }
    getBirthdaySetup(sessionId)
      .then(res => {
        setParty(res.data);
        setThemeColor(res.data.theme_color || '#ff6b9d');
        setWelcomeMessage(res.data.welcome_message || '');
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load your party. Please contact support.');
        setLoading(false);
      });
  }, [sessionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('theme_color', themeColor);
    formData.append('welcome_message', welcomeMessage);
    if (bannerImage) formData.append('banner_image', bannerImage);

    try {
      await saveBirthdaySetup(formData);
      router.push(`/birthday/${party.slug}`);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  if (loading) return <div className="birthday-setup-loading"><p>Loading your party...</p></div>;

  if (error && !party) return (
    <div className="birthday-setup-error">
      <p>{error}</p>
    </div>
  );

  return (
    <div className="birthday-setup-page">
      <section className="page-hero" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #c850c0 100%)` }}>
        <div className="container">
          <h1>🎉 Almost there, {party?.host_name}!</h1>
          <p>Customize {party?.birthday_person_name}'s party page before it goes live.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <form onSubmit={handleSave} className="birthday-setup-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="setup-preview">
              <h3>Your page URL:</h3>
              <a
                href={`/birthday/${party?.slug}`}
                target="_blank"
                rel="noreferrer"
                className="party-url-preview"
              >
                1rockstarsocial.com/birthday/{party?.slug}
              </a>
              <p className="setup-note">Your page is already live! Customize it below and click Save.</p>
            </div>

            <div className="form-group">
              <label>Theme Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  className="color-text"
                  placeholder="#ff6b9d"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="welcome_message">Welcome Message</label>
              <textarea
                id="welcome_message"
                value={welcomeMessage}
                onChange={e => setWelcomeMessage(e.target.value)}
                rows="4"
                placeholder={`Welcome to ${party?.birthday_person_name}'s birthday celebration!`}
              />
            </div>

            <div className="form-group">
              <label htmlFor="banner_image">Banner Image (optional)</label>
              <input
                type="file"
                id="banner_image"
                accept="image/*"
                onChange={e => setBannerImage(e.target.files[0])}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-large" disabled={saving}>
              {saving ? 'Saving...' : 'Save & Go to My Party Page'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default BirthdaySetup;
