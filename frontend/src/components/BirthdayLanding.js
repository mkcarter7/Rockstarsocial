'use client';

import React from 'react';
import Link from 'next/link';
import './BirthdayLanding.css';

const BirthdayLanding = () => {
  return (
    <div className="birthday-landing">
      <section className="birthday-hero">
        <div className="container">
          <div className="birthday-hero-content">
            <h1>🎂 Create a Birthday Experience They'll Never Forget</h1>
            <p className="birthday-hero-subtitle">
              Give your loved one their own personal birthday party page — complete with photos,
              guest book, RSVP, and a fun trivia game about the birthday star.
            </p>
            <Link href="/birthday/purchase" className="btn btn-primary btn-large">
              Get Started — $29
            </Link>
            <p className="birthday-hero-note">
              Page stays live for 60 days after the event · No subscription required
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Everything Included</h2>
          <div className="birthday-features-grid">
            <div className="birthday-feature-card">
              <div className="feature-icon">🎉</div>
              <h3>Party Page</h3>
              <p>A beautiful, shareable page with the birthday person's name, date, countdown timer, and your personal welcome message.</p>
            </div>
            <div className="birthday-feature-card">
              <div className="feature-icon">📸</div>
              <h3>Photo Gallery</h3>
              <p>Guests can upload and view photos directly on the party page. Build a shared memory album together.</p>
            </div>
            <div className="birthday-feature-card">
              <div className="feature-icon">📖</div>
              <h3>Guest Book</h3>
              <p>Let guests leave heartfelt messages and wishes for the birthday person to read and keep forever.</p>
            </div>
            <div className="birthday-feature-card">
              <div className="feature-icon">✅</div>
              <h3>RSVP</h3>
              <p>Guests can RSVP yes, no, or maybe. See at a glance who's coming and how many people to expect.</p>
            </div>
            <div className="birthday-feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Trivia Game</h3>
              <p>Create custom trivia questions about the birthday person. Guests compete for the top spot on the leaderboard.</p>
            </div>
            <div className="birthday-feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Your Own URL</h3>
              <p>Choose a custom URL like <strong>1rockstarsocial.com/birthday/kate-smith</strong> that's easy to share with everyone.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="birthday-cta">
            <h2>Ready to celebrate?</h2>
            <p>Set up your birthday page in minutes. Share the link. Watch the love pour in.</p>
            <Link href="/birthday/purchase" className="btn btn-primary btn-large">
              Create a Birthday Page — $29
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdayLanding;
