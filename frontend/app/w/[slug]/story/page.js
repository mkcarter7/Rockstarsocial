import WeddingStory from '@/components/wedding/WeddingStory';

export default function WeddingStoryPage({ params }) {
  return <WeddingStory slug={params.slug} />;
}
