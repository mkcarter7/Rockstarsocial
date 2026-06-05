'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyHostToken } from '../api/api';

const HostVerify = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No token found in this link.');
      setStatus('error');
      return;
    }

    verifyHostToken(token)
      .then(res => {
        localStorage.setItem('hostToken', res.data.session_token);
        if (res.data.party_slug) {
          localStorage.setItem('hostPartySlug', res.data.party_slug);
        } else {
          localStorage.removeItem('hostPartySlug');
        }
        if (res.data.all_parties && res.data.all_parties.length > 0) {
          localStorage.setItem('hostAllParties', JSON.stringify(res.data.all_parties));
        } else {
          localStorage.removeItem('hostAllParties');
        }
        if (res.data.host_email) {
          localStorage.setItem('hostEmail', res.data.host_email);
        }
        router.push('/host/dashboard');
      })
      .catch(err => {
        setErrorMsg(err?.response?.data?.error || 'This link is invalid or has expired.');
        setStatus('error');
      });
  }, [token, router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="text-[3rem] mb-4">🔐</div>
          <p className="text-[#555] text-[1.1rem]">Verifying your link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-5">
      <div className="bg-white rounded-[12px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.08)] text-center max-w-[420px] w-full">
        <div className="text-[3rem] mb-4">⚠️</div>
        <h2 className="mb-3">Link not valid</h2>
        <p className="text-[#555] mb-6">{errorMsg}</p>
        <Link href="/host/login" className="btn btn-primary">
          Request a new link
        </Link>
      </div>
    </div>
  );
};

export default HostVerify;
