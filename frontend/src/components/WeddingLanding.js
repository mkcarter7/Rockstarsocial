'use client';

import React from 'react';
import Link from 'next/link';

const FEATURES = [
  { symbol: '✦', title: 'Wedding Page', desc: 'A refined, shareable page featuring the couple\'s names, wedding date, a live countdown, and your personal welcome message.' },
  { symbol: '📷', title: 'Photo Gallery', desc: 'Guests can upload and view photos directly on the wedding page — a shared album you\'ll treasure forever.' },
  { symbol: '♡', title: 'Guest Book', desc: 'Let guests leave heartfelt messages and wishes for the happy couple to read and keep long after the day.' },
  { symbol: '✉', title: 'RSVP', desc: 'Guests can RSVP attending, not attending, or maybe. See at a glance who to expect on your special day.' },
  { symbol: '∞', title: 'Our Story', desc: 'Share the journey — from first date to engagement — in a beautiful timeline your guests will love reading.' },
  { symbol: '◇', title: 'Your Own URL', desc: <span>Choose a custom URL like <strong>1rockstarsocial.com/sarah-and-james</strong> that\'s easy to share with everyone.</span> },
];

const Divider = () => (
  <div className="flex items-center justify-center gap-4 my-2">
    <div className="h-px flex-1 max-w-[80px]" style={{ background: 'rgba(201,169,110,0.4)' }} />
    <span style={{ color: '#c9a96e', fontSize: '0.85rem' }}>♡</span>
    <div className="h-px flex-1 max-w-[80px]" style={{ background: 'rgba(201,169,110,0.4)' }} />
  </div>
);

const WeddingLanding = () => {
  return (
    <div>
      <section
        className="py-[100px] text-center"
        style={{ background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' }}
      >
        <div className="container">
          <p className="text-[0.75rem] uppercase tracking-[0.3em] font-light mb-4" style={{ color: '#c9a96e' }}>
            RockStar Social
          </p>
          <h1 className="text-[2rem] md:text-[2.8rem] mb-2 font-light tracking-[0.05em]" style={{ color: '#3d2c1e' }}>
            Your Wedding, Beautifully Shared
          </h1>
          <Divider />
          <p className="text-[1.1rem] max-w-[580px] mx-auto mb-[40px] mt-4 leading-relaxed font-light" style={{ color: '#5a3e2b' }}>
            Give your guests a dedicated wedding page — complete with photos, a guest book,
            RSVP, and a timeline of your love story.
          </p>
          <Link
            href="/wedding/purchase"
            className="inline-block py-4 px-12 text-[1rem] tracking-[0.1em] uppercase font-semibold rounded-none hover:opacity-90 transition-opacity"
            style={{ background: '#c9a96e', color: '#fff' }}
          >
            Get Started — $49
          </Link>
          <Link
            href="/weddingdemo"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-[0.85rem] underline opacity-60 hover:opacity-90 transition-opacity tracking-wide"
            style={{ color: '#5a3e2b' }}
          >
            See a live demo →
          </Link>
          <p className="mt-5 text-[0.85rem] opacity-50 tracking-wide" style={{ color: '#5a3e2b' }}>
            Page stays live for 1 year after your wedding · No subscription required
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#fdfaf7' }}>
        <div className="container">
          <div className="text-center mb-12">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light mb-3" style={{ color: '#c9a96e' }}>
              Everything Included
            </p>
            <h2 className="text-[1.8rem] font-light tracking-[0.05em]" style={{ color: '#3d2c1e' }}>
              All you need for the perfect day
            </h2>
            <Divider />
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[30px] mt-6">
            {FEATURES.map(({ symbol, title, desc }) => (
              <div
                key={title}
                className="rounded-[4px] p-[36px] text-center"
                style={{ background: '#fff', border: '1px solid rgba(201,169,110,0.3)', boxShadow: '0 2px 16px rgba(201,169,110,0.06)' }}
              >
                <div className="text-[1.6rem] mb-4 font-light" style={{ color: '#c9a96e' }}>{symbol}</div>
                <h3 className="text-[0.9rem] mb-3 uppercase tracking-[0.15em] font-semibold" style={{ color: '#3d2c1e' }}>{title}</h3>
                <p className="leading-relaxed font-light text-[0.95rem]" style={{ color: '#7a6050' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' }}>
        <div className="container">
          <div className="text-center py-8">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light mb-3" style={{ color: '#8b6914' }}>
              Begin Your Journey
            </p>
            <h2 className="text-[2rem] font-light tracking-[0.05em] mb-3" style={{ color: '#3d2c1e' }}>
              Ready to celebrate?
            </h2>
            <Divider />
            <p className="text-[1rem] mb-[36px] mt-4 font-light leading-relaxed" style={{ color: '#5a3e2b' }}>
              Set up your wedding page in minutes. Share the link. Let your loved ones celebrate with you.
            </p>
            <Link
              href="/wedding/purchase"
              className="inline-block py-4 px-12 text-[1rem] tracking-[0.1em] uppercase font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#c9a96e', color: '#fff' }}
            >
              Create Your Wedding Page — $49
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WeddingLanding;
