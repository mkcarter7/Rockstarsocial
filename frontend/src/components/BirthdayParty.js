'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty } from '../api/api';
import './BirthdayParty.css';

const Countdown = ({ partyDate, themeColor }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(partyDate) - new Date();
      if (diff <= 0) return setTimeLeft(null);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [partyDate]);

  if (!timeLeft) return <p className="countdown-past">🎉 The celebration is here!</p>;

  return (
    <div className="countdown">
      {['days', 'hours', 'minutes', 'seconds'].map(unit => (
        <div key={unit} className="countdown-unit" style={{ borderColor: themeColor }}>
          <span className="countdown-number" style={{ color: themeColor }}>{timeLeft[unit]}</span>
          <span className="countdown-label">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const BirthdayParty = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notActive, setNotActive] = useState(false);

  useEffect(() => {
    getBirthdayParty(slug)
      .then(res => { setParty(res.data); setLoading(false); })
      .catch(err => {
        const msg = err?.response?.data?.error || '';
        if (msg === 'This party is not yet active') {
          setNotActive(true);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="party-loading"><p>Loading party...</p></div>;
  if (notActive) return (
    <div className="party-not-found">
      <h1>Almost Ready!</h1>
      <p>This birthday page is being set up. Check back in a moment or finish your setup.</p>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
  if (notFound) return (
    <div className="party-not-found">
      <h1>Party Not Found</h1>
      <p>This birthday page doesn't exist or has expired.</p>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  const color = party.theme_color || '#ff6b9d';

  return (
    <div className="birthday-party-page">
      {/* Hero */}
      <section className="party-hero" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        {party.banner_image && (
          <div className="party-banner" style={{ backgroundImage: `url(${party.banner_image})` }} />
        )}
        <div className="container party-hero-content">
          <h1>🎂 Happy Birthday, {party.birthday_person_name}!</h1>
          {party.welcome_message && <p className="party-welcome">{party.welcome_message}</p>}
          <Countdown partyDate={party.party_date} themeColor={color} />
        </div>
      </section>

      {/* Feature nav tiles */}
      <section className="party-nav-section">
        <div className="container">
          <div className="party-nav-grid">
            <Link href={`/birthday/${slug}/photos`} className="party-nav-tile" style={{ borderColor: color }}>
              <span className="tile-icon">📸</span>
              <span>Photos</span>
            </Link>
            <Link href={`/birthday/${slug}/guestbook`} className="party-nav-tile" style={{ borderColor: color }}>
              <span className="tile-icon">📖</span>
              <span>Guest Book</span>
            </Link>
            <Link href={`/birthday/${slug}/rsvp`} className="party-nav-tile" style={{ borderColor: color }}>
              <span className="tile-icon">✅</span>
              <span>RSVP</span>
            </Link>
            <Link href={`/birthday/${slug}/trivia`} className="party-nav-tile" style={{ borderColor: color }}>
              <span className="tile-icon">🎯</span>
              <span>Trivia</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="party-footer">
        <p>
          Created with <a href="/" style={{ color }}>RockStar Social</a>
          &nbsp;·&nbsp; Active until {new Date(party.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default BirthdayParty;
