'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerStory } from '../../api/api';

const StoryCard = ({ entry, color }) => (
  <div className="bg-white p-6 w-full" style={{ border: `1px solid ${color}30`, boxShadow: '0 2px 16px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
    <p className="text-[0.65rem] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color }}>{entry.date_label}</p>
    <h3 className="text-[1rem] font-light mb-1" style={{ color: '#3d1f0e' }}>{entry.title}</h3>
    {entry.description && (
      <p className="text-[0.9rem] font-light leading-relaxed m-0" style={{ color: '#7a5a46' }}>{entry.description}</p>
    )}
  </div>
);

const BabyShowerStory = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBabyShower(slug), getBabyShowerStory(slug)])
      .then(([partyRes, storyRes]) => { setParty(partyRes.data); setEntries(storyRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : color }}>
            ← Back to Baby Shower
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>Our Journey</h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            {party?.parent_names ? `The journey of ${party.parent_names}` : 'The journey to parenthood'}
          </p>
        </div>
      </div>

      <div className="container py-14">
        {entries.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0906e' }}>
            The journey is being written — check back soon!
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col gap-8 pl-6 relative">
              <div className="absolute left-0 top-2 bottom-2 w-px" style={{ background: `${color}30` }} />
              {entries.map(entry => (
                <div key={entry.id} className="relative">
                  <div className="absolute -left-[29px] top-6 w-3 h-3 rounded-full" style={{ background: color }} />
                  <StoryCard entry={entry} color={color} />
                </div>
              ))}
            </div>
            <div className="hidden md:block relative" style={{ maxWidth: 800, margin: '0 auto' }}>
              <div className="absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-px" style={{ background: `${color}30` }} />
              <div className="flex flex-col gap-10">
                {entries.map((entry, i) => {
                  const isLeft = i % 2 === 0;
                  return (
                    <div key={entry.id} className="relative grid grid-cols-2 gap-8 items-center">
                      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-10" style={{ background: color }} />
                      <div className={`pr-8 ${isLeft ? '' : 'invisible'}`}>{isLeft && <StoryCard entry={entry} color={color} />}</div>
                      <div className={`pl-8 ${isLeft ? 'invisible' : ''}`}>{!isLeft && <StoryCard entry={entry} color={color} />}</div>
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

export default BabyShowerStory;
