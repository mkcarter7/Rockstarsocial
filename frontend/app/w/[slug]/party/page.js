import WeddingPartyMembers from '@/components/wedding/WeddingPartyMembers';

export default function WeddingPartyMembersPage({ params }) {
  return <WeddingPartyMembers slug={params.slug} />;
}
