'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty } from '@/api/api';
import PartyGuestbook from '@/components/birthday/PartyGuestbook';
import WeddingGuestbook from '@/components/wedding/WeddingGuestbook';

export default function GuestbookPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() => setType('wedding'));
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingGuestbook slug={params.slug} />;
  return <PartyGuestbook slug={params.slug} />;
}
