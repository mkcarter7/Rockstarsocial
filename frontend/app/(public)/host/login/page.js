import { Suspense } from 'react';
import HostLogin from '@/components/HostLogin';

export default function HostLoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <HostLogin />
    </Suspense>
  );
}
