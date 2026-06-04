'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty } from '@/api/api';
import PartyPhotos from '@/components/birthday/PartyPhotos';
import WeddingPhotos from '@/components/wedding/WeddingPhotos';

export default function PhotosPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() => setType('wedding'));
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingPhotos slug={params.slug} />;
  return <PartyPhotos slug={params.slug} />;
}
