import PartyPhotos from '@/components/birthday/PartyPhotos';

export default function PhotosPage({ params }) {
  return <PartyPhotos slug={params.slug} />;
}
