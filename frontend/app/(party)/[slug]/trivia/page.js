'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getBabyShower } from '@/api/api';
import PartyTrivia from '@/components/birthday/PartyTrivia';
import BabyShowerTrivia from '@/components/baby_shower/BabyShowerTrivia';

export default function TriviaPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() =>
        getBabyShower(params.slug)
          .then(() => setType('baby_shower'))
          .catch(() => setType('birthday'))
      );
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'baby_shower') return <BabyShowerTrivia slug={params.slug} />;
  return <PartyTrivia slug={params.slug} />;
}
