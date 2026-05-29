import { Suspense } from 'react';
import BirthdaySetup from '@/components/BirthdaySetup';

export default function BirthdaySetupPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <BirthdaySetup />
    </Suspense>
  );
}
