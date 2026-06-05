'use client';
import { useState, useEffect } from 'react';
import { getBirthdayParty, getBabyShower } from '@/api/api';
import PartyPhotos from '@/components/birthday/PartyPhotos';
import WeddingPhotos from '@/components/wedding/WeddingPhotos';
import BabyShowerPhotos from '@/components/baby_shower/BabyShowerPhotos';

export default function PhotosPage({ params }) {
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
  if (type === 'baby_shower') return <BabyShowerPhotos slug={params.slug} />;
  if (type === 'wedding') return <WeddingPhotos slug={params.slug} />;
  return <PartyPhotos slug={params.slug} />;
}
