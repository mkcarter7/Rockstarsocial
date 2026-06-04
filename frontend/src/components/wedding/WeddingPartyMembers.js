'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingPartyMembers } from '../../api/api';

const WeddingPartyMembers = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWeddingParty(slug), getWeddingPartyMembers(slug)])
      .then(([partyRes, membersRes]) => {
        setParty(partyRes.data);
        setMembers(membersRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-center py-20"><p className="font-light" style={{ color: '#7a6050' }}>Loading...</p></div>;
  if (!party) return null;

  const color = party.theme_color || '#c9a96e';
  const secondaryColor = party.secondary_color || '#fdfaf7';
  const hasBanner = !!party.banner_image;
  const heroStyle = hasBanner
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' };

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      {/* Hero */}
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link
            href={`/${slug}`}
            className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : color }}
          >
            ← Back to Wedding
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]" style={{ color: hasBanner ? '#fff' : '#3d2c1e' }}>
            Wedding Party
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            {party.couple_name ? `Meet the people celebrating with ${party.couple_name}` : 'Meet our wedding party'}
          </p>
        </div>
      </div>

      {/* Members grid */}
      <div className="container py-12">
        {members.length === 0 ? (
          <p className="text-center font-light py-12" style={{ color: '#9a8070' }}>
            The wedding party will be announced soon ♡
          </p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-8">
            {members.map(member => (
              <div key={member.id} className="flex flex-col items-center text-center">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full object-cover mb-4"
                    style={{
                      height: 220,
                      borderRadius: '80px 80px 4px 4px',
                      boxShadow: '0 4px 20px rgba(201,169,110,0.15)',
                    }}
                  />
                ) : (
                  <div
                    className="w-full flex items-center justify-center mb-4 text-[2rem] font-light"
                    style={{
                      height: 220,
                      borderRadius: '80px 80px 4px 4px',
                      background: `${color}18`,
                      color,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="font-semibold text-[0.95rem] mb-1" style={{ color: '#3d2c1e' }}>{member.name}</p>
                <p className="text-[0.75rem] uppercase tracking-[0.15em] font-light" style={{ color }}>{member.role}</p>
                {member.bio && (
                  <p className="text-[0.85rem] font-light mt-2 leading-relaxed" style={{ color: '#7a6050' }}>{member.bio}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeddingPartyMembers;
