import WeddingPartyMembers from '@/components/wedding/WeddingPartyMembers';

export default function WeddingPartyPage({ params }) {
  return <WeddingPartyMembers slug={params.slug} />;
}
