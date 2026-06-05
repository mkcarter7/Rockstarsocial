'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getBabyShower } from '@/api/api';
import PartyGuestbook from '@/components/birthday/PartyGuestbook';
import WeddingGuestbook from '@/components/wedding/WeddingGuestbook';
import BabyShowerGuestbook from '@/components/baby_shower/BabyShowerGuestbook';

export default function GuestbookPage({ params }) {
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
  if (type === 'baby_shower') return <BabyShowerGuestbook slug={params.slug} />;
  if (type === 'wedding') return <WeddingGuestbook slug={params.slug} />;
  return <PartyGuestbook slug={params.slug} />;
}
