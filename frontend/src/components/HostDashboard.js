'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHostPartyStats } from '../api/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-[12px] border-2 p-6 text-center" style={{ borderColor: color }}>
    <div className="text-[2.5rem] mb-2">{icon}</div>
    <div className="text-[2rem] font-bold" style={{ color }}>{value}</div>
    <div className="text-[0.8rem] uppercase tracking-widest text-[#888] mt-1">{label}</div>
  </div>
);

const HostDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hostToken, setHostToken] = useState('');
  const [hostSlug, setHostSlug] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    const slug = localStorage.getItem('hostPartySlug');

    if (!token || !slug) {
      router.push('/host/login');
      return;
    }

    setHostToken(token);
    setHostSlug(slug);

    getHostPartyStats(slug, token)
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => {
        const msg = err?.response?.data?.error || '';
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          // Token expired or invalid — clear and redirect to login
          localStorage.removeItem('hostToken');
          localStorage.removeItem('hostPartySlug');
          router.push('/host/login');
        } else {
          setError(msg || 'Could not load your party. Please try again.');
          setLoading(false);
        }
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('hostToken');
    localStorage.removeItem('hostPartySlug');
    router.push('/host/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <p className="text-[#555]">Loading your party…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-5">
        <div className="text-center">
          <p className="text-[#742a2a] mb-4">{error}</p>
          <Link href="/host/login" className="btn btn-primary">Back to Login</Link>
        </div>
      </div>
    );
  }

  const color = '#ff6b9d';
  const formatDate = (d) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section
        className="py-[70px] text-center text-white"
        style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}
      >
        <div className="container">
          <h1 className="text-[2.2rem] text-white mb-2">
            🎂 {stats.birthday_person_name}'s Party
          </h1>
          <p className="opacity-90 text-[1rem]">{formatDate(stats.party_date)}</p>
          {stats.host_name && (
            <p className="opacity-75 text-[0.9rem] mt-1">Hosted by {stats.host_name}</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 className="text-center mb-6 text-[#333]">Party Stats</h2>
          <div className="grid grid-cols-3 sm:grid-cols-1 gap-5 mb-10">
            <StatCard icon="✅" label="RSVPs (Yes)" value={stats.rsvp_count} color={color} />
            <StatCard icon="📖" label="Guestbook" value={stats.guestbook_count} color={color} />
            <StatCard icon="📸" label="Photos" value={stats.photo_count} color={color} />
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href={`/birthday/${hostSlug}`}
              className="flex items-center justify-center gap-2 bg-white border-2 rounded-[10px] py-4 px-6 font-semibold text-[#333] hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow]"
              style={{ borderColor: color }}
            >
              🎉 View Party Page
            </Link>

            <Link
              href={`/birthday/setup?session_token=${hostToken}`}
              className="flex items-center justify-center gap-2 text-white rounded-[10px] py-4 px-6 font-semibold hover:opacity-90 transition-opacity"
              style={{ background: color }}
            >
              ✏️ Edit Party (colors, message, trivia)
            </Link>

            <button
              onClick={handleLogout}
              className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors mt-2"
            >
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostDashboard;
