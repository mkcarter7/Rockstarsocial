'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getWeddingParty } from '@/api/api';
import BirthdayParty from '@/components/BirthdayParty';
import WeddingParty from '@/components/WeddingParty';

export default function PartyPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() =>
        getWeddingParty(params.slug)
          .then(() => setType('wedding'))
          .catch(() => setType('birthday')) // let BirthdayParty render its not-found state
      );
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingParty slug={params.slug} />;
  return <BirthdayParty slug={params.slug} />;
}
