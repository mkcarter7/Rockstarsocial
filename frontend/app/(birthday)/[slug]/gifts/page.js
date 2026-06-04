'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty } from '@/api/api';
import PartyGifts from '@/components/birthday/PartyGifts';
import WeddingGifts from '@/components/wedding/WeddingGifts';

export default function GiftsPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() => setType('wedding'));
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingGifts slug={params.slug} />;
  return <PartyGifts slug={params.slug} />;
}
