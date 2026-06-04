import WeddingGuestbook from '@/components/wedding/WeddingGuestbook';

export default function WeddingGuestbookPage({ params }) {
  return <WeddingGuestbook slug={params.slug} />;
}
