import WeddingPhotos from '@/components/wedding/WeddingPhotos';

export default function WeddingPhotosPage({ params }) {
  return <WeddingPhotos slug={params.slug} />;
}
