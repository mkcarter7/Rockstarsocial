'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingStory } from '../../api/api';

const StoryCard = ({ entry, color }) => (
  <div
    className="bg-white rounded-[4px] p-6 w-full"
    style={{ border: `1px solid ${color}30`, boxShadow: '0 2px 16px rgba(201,169,110,0.08)' }}
  >
    <p className="text-[0.65rem] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color }}>{entry.date_label}</p>
    <h3 className="text-[1rem] font-light mb-1" style={{ color: '#3d2c1e' }}>{entry.title}</h3>
    {entry.description && (
      <p className="text-[0.9rem] font-light leading-relaxed m-0" style={{ color: '#7a6050' }}>{entry.description}</p>
    )}
  </div>
);

const WeddingStory = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWeddingParty(slug), getWeddingStory(slug)])
      .then(([partyRes, storyRes]) => {
        setParty(partyRes.data);
        setEntries(storyRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const color = party?.theme_color || '#c9a96e';
  const secondaryColor = party?.secondary_color || '#fdfaf7';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a6050' }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#c9a96e' }}>
            ← Back to Wedding
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d2c1e' }}>
            Our Story
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            {party?.couple_name ? `The journey of ${party.couple_name}` : 'Our journey together'}
          </p>
        </div>
      </div>

      <div className="container py-14">
        {entries.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0a090' }}>
            The story is being written — check back soon!
          </div>
        ) : (
          <>
            {/* Mobile: single column with left line */}
            <div className="md:hidden flex flex-col gap-8 pl-6 relative">
              <div className="absolute left-0 top-2 bottom-2 w-px" style={{ background: `${color}30` }} />
              {entries.map(entry => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-[29px] top-6 w-3 h-3 rounded-full" style={{ background: color }} />
                  <StoryCard entry={entry} color={color} />
                </div>
              ))}
            </div>

            {/* Desktop: alternating left/right */}
            <div className="hidden md:block relative" style={{ maxWidth: 800, margin: '0 auto' }}>
              {/* Center line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px" style={{ background: `${color}30` }} />

              <div className="flex flex-col gap-10">
                {entries.map((entry, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={entry.id} className="relative grid grid-cols-2 gap-8 items-center">
                      {/* Gold dot */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10"
                        style={{ background: color }}
                      />
                      {/* Left cell */}
                      <div className={`pr-8 ${isLeft ? '' : 'invisible'}`}>
                        {isLeft && <StoryCard entry={entry} color={color} />}
                      </div>
                      {/* Right cell */}
                      <div className={`pl-8 ${isLeft ? 'invisible' : ''}`}>
                        {!isLeft && <StoryCard entry={entry} color={color} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeddingStory;
