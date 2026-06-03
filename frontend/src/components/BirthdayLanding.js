'use client';

import React from 'react';
import Link from 'next/link';

const FEATURES = [
  { icon: '🎉', title: 'Party Page', desc: "A beautiful, shareable page with the birthday person's name, date, countdown timer, and your personal welcome message." },
  { icon: '📸', title: 'Photo Gallery', desc: 'Guests can upload and view photos directly on the party page. Build a shared memory album together.' },
  { icon: '📖', title: 'Guest Book', desc: 'Let guests leave heartfelt messages and wishes for the birthday person to read and keep forever.' },
  { icon: '✅', title: 'RSVP', desc: "Guests can RSVP yes, no, or maybe. See at a glance who's coming and how many people to expect." },
  { icon: '🎯', title: 'Trivia Game', desc: 'Create custom trivia questions about the birthday person. Guests compete for the top spot on the leaderboard.' },
  { icon: '🔗', title: 'Your Own URL', desc: <span>Choose a custom URL like <strong>1rockstarsocial.com/kate-smith</strong> that's easy to share with everyone.</span> },
];

const BirthdayLanding = () => {
  return (
    <div>
      <section className="bg-[linear-gradient(135deg,#ff6b9d_0%,#c850c0_100%)] text-white py-[80px] text-center">
        <div className="container">
          <h1 className="text-[1.8rem] md:text-[2.5rem] mb-5 text-white">🎂 Create a Birthday Experience They'll Never Forget</h1>
          <p className="text-[1.2rem] max-w-[600px] mx-auto mb-[30px] opacity-95">
            Give your loved one their own personal birthday party page — complete with photos,
            guest book, RSVP, and a fun trivia game about the birthday star.
          </p>
          <Link href="/birthday/purchase" className="btn btn-primary py-4 px-10 text-[1.1rem]">
            Get Started — $29
          </Link>
          <Link href="/birthdaydemo" target="_blank" rel="noopener noreferrer"
            className="block mt-3 text-white underline opacity-80 hover:opacity-100 text-sm transition-opacity">
            See a live demo →
          </Link>
          <p className="mt-[15px] text-[0.9rem] opacity-80">
            Page stays live for 60 days after the event · No subscription required
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Everything Included</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[30px] mt-10">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_15px_rgba(0,0,0,0.08)] text-center">
                <div className="text-[2.5rem] mb-[15px]">{icon}</div>
                <h3 className="text-[1.2rem] mb-[10px] text-[#333]">{title}</h3>
                <p className="text-[#666] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-gradient-to-b from-[#e8e8e8] to-[#d8d8d8]">
        <div className="container">
          <div className="text-center py-10">
            <h2 className="text-[2rem] mb-[15px]">Ready to celebrate?</h2>
            <p className="text-[1.1rem] text-[#555] mb-[30px]">Set up your birthday page in minutes. Share the link. Watch the love pour in.</p>
            <Link href="/birthday/purchase" className="btn btn-primary py-4 px-10 text-[1.1rem]">
              Create a Birthday Page — $29
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdayLanding;
