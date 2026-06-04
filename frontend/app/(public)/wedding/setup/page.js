import { Suspense } from 'react';
import WeddingSetup from '../../../../src/components/WeddingSetup';

export default function WeddingSetupPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <WeddingSetup />
    </Suspense>
  );
}
