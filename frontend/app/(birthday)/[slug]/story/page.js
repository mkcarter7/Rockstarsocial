import WeddingStory from '@/components/wedding/WeddingStory';

export default function StoryPage({ params }) {
  return <WeddingStory slug={params.slug} />;
}
