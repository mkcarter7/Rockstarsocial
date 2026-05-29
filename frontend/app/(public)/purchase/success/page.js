import { Suspense } from 'react';
import PurchaseSuccess from '@/components/PurchaseSuccess';

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={<div className="purchase-status"><div className="container"><div className="loading">Verifying your purchase...</div></div></div>}>
      <PurchaseSuccess />
    </Suspense>
  );
}
