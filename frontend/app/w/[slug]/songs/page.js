import WeddingSongRequests from '@/components/wedding/WeddingSongRequests';

export default function WeddingSongRequestsPage({ params }) {
  return <WeddingSongRequests slug={params.slug} />;
}
