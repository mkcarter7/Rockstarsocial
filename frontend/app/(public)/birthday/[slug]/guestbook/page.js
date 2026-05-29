import PartyGuestbook from '@/components/birthday/PartyGuestbook';

export default function GuestbookPage({ params }) {
  return <PartyGuestbook slug={params.slug} />;
}
