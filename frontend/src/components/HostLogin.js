'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hostLogin } from '../api/api';

const HostLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await hostLogin(email.trim().toLowerCase(), password);
      localStorage.setItem('hostToken', res.data.session_token);
      localStorage.setItem('hostPartySlug', res.data.party_slug);
      localStorage.setItem('hostAllParties', JSON.stringify(res.data.all_parties || []));
      router.push('/host/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid email or password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section
        className="py-[80px] text-center text-white"
        style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c850c0 100%)' }}
      >
        <div className="container">
          <h1 className="text-[2.2rem] text-white mb-3">🎂 Party Host Login</h1>
          <p className="text-[1.1rem] opacity-90">
            Log in to manage your party page.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 480 }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[12px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.08)]"
          >
            {error && (
              <div className="py-3 px-4 rounded-[6px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181] text-[0.9rem]">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 mb-5">
              <label htmlFor="host-email" className="font-semibold text-black">
                Email address
              </label>
              <input
                id="host-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="py-[10px] px-3 border border-[#ddd] rounded-[6px] text-[0.9rem] outline-none focus:border-[#ff6b9d] w-full"
              />
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <label htmlFor="host-password" className="font-semibold text-black">
                Password
              </label>
              <input
                id="host-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="py-[10px] px-3 border border-[#ddd] rounded-[6px] text-[0.9rem] outline-none focus:border-[#ff6b9d] w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-[1rem] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <p className="text-center mt-5 text-[0.85rem] text-[#888]">
              Forgot your password?{' '}
              <Link href="/host/forgot-password" className="text-[#ff6b9d] underline">
                Get a login link by email
              </Link>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HostLogin;
