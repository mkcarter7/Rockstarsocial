import { Suspense } from 'react';
import BabyShowerSetup from '../../../../src/components/BabyShowerSetup';

export default function BabyShowerSetupPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <BabyShowerSetup />
    </Suspense>
  );
}
