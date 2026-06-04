'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty } from '@/api/api';
import PartyRSVP from '@/components/birthday/PartyRSVP';
import WeddingRSVP from '@/components/wedding/WeddingRSVP';

export default function RSVPPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() => setType('wedding'));
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingRSVP slug={params.slug} />;
  return <PartyRSVP slug={params.slug} />;
}
