import { Suspense } from 'react';
import BabyShowerPurchase from '../../../../src/components/BabyShowerPurchase';

export default function BabyShowerPurchasePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <BabyShowerPurchase />
    </Suspense>
  );
}
