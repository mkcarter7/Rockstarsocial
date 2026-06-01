import { Suspense } from 'react';
import HostVerify from '@/components/HostVerify';

export default function HostVerifyPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Verifying...</div>}>
      <HostVerify />
    </Suspense>
  );
}
