import WeddingParty from '@/components/WeddingParty';

export default function WeddingPartyPage({ params }) {
  return <WeddingParty slug={params.slug} />;
}
