import PartyRSVP from '@/components/birthday/PartyRSVP';

export default function RSVPPage({ params }) {
  return <PartyRSVP slug={params.slug} />;
}
