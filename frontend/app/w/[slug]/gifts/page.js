import WeddingGifts from '@/components/wedding/WeddingGifts';

export default function WeddingGiftsPage({ params }) {
  return <WeddingGifts slug={params.slug} />;
}
