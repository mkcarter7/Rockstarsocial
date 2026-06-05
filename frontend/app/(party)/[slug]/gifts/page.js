'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getBabyShower } from '@/api/api';
import PartyGifts from '@/components/birthday/PartyGifts';
import WeddingGifts from '@/components/wedding/WeddingGifts';
import BabyShowerGifts from '@/components/baby_shower/BabyShowerGifts';

export default function GiftsPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() =>
        getBabyShower(params.slug)
          .then(() => setType('baby_shower'))
          .catch(() => setType('wedding'))
      );
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'baby_shower') return <BabyShowerGifts slug={params.slug} />;
  if (type === 'wedding') return <WeddingGifts slug={params.slug} />;
  return <PartyGifts slug={params.slug} />;
}
