import PartyPageClient from './PartyPageClient';

const API   = process.env.NEXT_PUBLIC_API_URL   || 'http://localhost:8000/api';
const MEDIA = process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000';
const SITE  = process.env.NEXT_PUBLIC_SITE_URL  || 'https://1rockstarsocial.com';

async function fetchPartyData(slug) {
  for (const path of [`/birthday/${slug}/`, `/wedding/${slug}/`, `/baby-shower/${slug}/`]) {
    try {
      const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
      if (res.ok) return await res.json();
    } catch {}
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchPartyData(slug);
  if (!data) return { title: 'RockStar Social' };

  const name = data.birthday_person_name || data.couple_name || data.parent_names || 'Party';
  const date = data.party_date || data.wedding_date || data.shower_date || '';
  const type = data.birthday_person_name ? 'Birthday Party'
             : data.couple_name          ? 'Wedding'
             :                             'Baby Shower';

  const title       = `${name}'s ${type}`;
  const description = date
    ? `Join ${name}'s ${type} celebration on ${date}!`
    : `You're invited to ${name}'s ${type}!`;

  const rawImage = data.banner_image || '';
  const image    = rawImage.startsWith('http')
    ? rawImage
    : `${MEDIA}${rawImage.startsWith('/') ? '' : '/media/'}${rawImage}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/${slug}`,
      siteName: 'RockStar Social',
      images: rawImage ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: rawImage ? [image] : [],
    },
  };
}

export default function PartyPage({ params }) {
  return <PartyPageClient params={params} />;
}
