import { Suspense } from 'react';
import HostDashboard from '@/components/HostDashboard';

export default function HostDashboardPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <HostDashboard />
    </Suspense>
  );
}
