import { Suspense } from 'react';
import HostForgotPassword from '@/components/HostForgotPassword';

export default function HostForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>}>
      <HostForgotPassword />
    </Suspense>
  );
}
