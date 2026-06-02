import BirthdayParty from '@/components/BirthdayParty';

export default function BirthdayPartyPage({ params }) {
  return <BirthdayParty slug={params.slug} />;
}
