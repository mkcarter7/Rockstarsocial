import BabyShowerNames from '@/components/baby_shower/BabyShowerNames';

export default function NamesPage({ params }) {
  return <BabyShowerNames slug={params.slug} />;
}
