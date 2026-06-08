'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBirthdayParty, getWeddingParty, getBabyShower, checkSlugRedirect } from '@/api/api';
import BirthdayParty from '@/components/BirthdayParty';
import WeddingParty from '@/components/WeddingParty';
import BabyShowerParty from '@/components/BabyShowerParty';

export default function PartyPage({ params }) {
  const [type, setType] = useState('loading');
  const router = useRouter();

  useEffect(() => {
    getBirthdayParty(params.slug)
      .then(() => setType('birthday'))
      .catch(() =>
        getWeddingParty(params.slug)
          .then(() => setType('wedding'))
          .catch(() =>
            getBabyShower(params.slug)
              .then(() => setType('baby_shower'))
              .catch(() =>
                checkSlugRedirect(params.slug)
                  .then(res => router.replace(`/${res.data.redirect_to}`))
                  .catch(() => setType('birthday'))
              )
          )
      );
  }, [params.slug]);

  if (type === 'loading') return null;
  if (type === 'wedding') return <WeddingParty slug={params.slug} />;
  if (type === 'baby_shower') return <BabyShowerParty slug={params.slug} />;
  return <BirthdayParty slug={params.slug} />;
}
