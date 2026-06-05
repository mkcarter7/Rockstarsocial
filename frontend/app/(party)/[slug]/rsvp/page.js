'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getBabyShower } from '@/api/api';
import PartyRSVP from '@/components/birthday/PartyRSVP';
import WeddingRSVP from '@/components/wedding/WeddingRSVP';
import BabyShowerRSVP from '@/components/baby_shower/BabyShowerRSVP';

export default function RSVPPage({ params }) {
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
  if (type === 'baby_shower') return <BabyShowerRSVP slug={params.slug} />;
  if (type === 'wedding') return <WeddingRSVP slug={params.slug} />;
  return <PartyRSVP slug={params.slug} />;
}
