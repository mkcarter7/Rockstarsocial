import PartyTrivia from '@/components/birthday/PartyTrivia';

export default function TriviaPage({ params }) {
  return <PartyTrivia slug={params.slug} />;
}
