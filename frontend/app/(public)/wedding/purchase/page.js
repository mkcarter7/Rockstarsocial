import { Suspense } from 'react';
import WeddingPurchase from '../../../../src/components/WeddingPurchase';

export default function WeddingPurchasePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <WeddingPurchase />
    </Suspense>
  );
}
