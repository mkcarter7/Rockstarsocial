import PartyGifts from '@/components/birthday/PartyGifts';

export default function GiftsPage({ params }) {
  return <PartyGifts slug={params.slug} />;
}
