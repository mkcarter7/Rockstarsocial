'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminProtectedLayout({ children }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/admin/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) return null;
  return <>{children}</>;
}
