import WeddingSongRequests from '@/components/wedding/WeddingSongRequests';

export default function SongsPage({ params }) {
  return <WeddingSongRequests slug={params.slug} />;
}
