import { Suspense } from 'react';
import BirthdayPurchase from '@/components/BirthdayPurchase';

export default function BirthdayPurchasePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <BirthdayPurchase />
    </Suspense>
  );
}
