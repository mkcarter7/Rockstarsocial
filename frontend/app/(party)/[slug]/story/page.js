'use client';
import { useState, useEffect } from 'react';
import { getBabyShower } from '@/api/api';
import WeddingStory from '@/components/wedding/WeddingStory';
import BabyShowerStory from '@/components/baby_shower/BabyShowerStory';

export default function StoryPage({ params }) {
  const [type, setType] = useState('loading');

  useEffect(() => {
    getBabyShower(params.slug)
      .then(() => setType('baby_shower'))
      .catch(() => setType('wedding'));
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'baby_shower') return <BabyShowerStory slug={params.slug} />;
  return <WeddingStory slug={params.slug} />;
}
