'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHostPartyStats, changeHostPassword } from '../api/api';

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
  const [allParties, setAllParties] = useState(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwStatus, setPwStatus] = useState({ type: '', message: '' });

  const loadParty = (slug, token) => {
    setLoading(true);
    setError('');
    getHostPartyStats(slug, token)
      .then(res => { setStats(res.data); setLoading(false); })
      .catch(err => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          localStorage.removeItem('hostToken');
          localStorage.removeItem('hostPartySlug');
          localStorage.removeItem('hostAllParties');
          router.push('/host/login');
        } else {
          setError(err?.response?.data?.error || 'Could not load your party. Please try again.');
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    const slug = localStorage.getItem('hostPartySlug');

    if (!token || !slug) {
      router.push('/host/login');
      return;
    }

    const parties = JSON.parse(localStorage.getItem('hostAllParties') || 'null');

    setHostToken(token);
    setHostSlug(slug);
    if (parties && parties.length > 1) setAllParties(parties);

    loadParty(slug, token);
  }, [router]);

  const pickParty = (slug) => {
    localStorage.setItem('hostPartySlug', slug);
    setHostSlug(slug);
    setAllParties(null);
    loadParty(slug, hostToken);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwStatus({ type: '', message: '' });
    if (newPassword.length < 8) {
      setPwStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    try {
      await changeHostPassword(newPassword, hostToken);
      setPwStatus({ type: 'success', message: 'Password updated successfully!' });
      setNewPassword('');
      setShowChangePw(false);
    } catch (err) {
      setPwStatus({ type: 'error', message: err?.response?.data?.error || 'Could not update password. Please try again.' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hostToken');
    localStorage.removeItem('hostPartySlug');
    localStorage.removeItem('hostAllParties');
    router.push('/host/login');
  };

  if (allParties && allParties.length > 1 && !stats) {
    const formatDate = (d) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <section className="py-[80px] text-center text-white" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c850c0 100%)' }}>
          <div className="container">
            <h1 className="text-[2.2rem] text-white mb-3">🎂 Your Parties</h1>
            <p className="opacity-90">Select a party to manage.</p>
          </div>
        </section>
        <section className="section">
          <div className="container" style={{ maxWidth: 480 }}>
            <div className="flex flex-col gap-4">
              {allParties.map(p => (
                <button
                  key={p.slug}
                  onClick={() => pickParty(p.slug)}
                  className="bg-white border-2 border-[#ff6b9d] rounded-[12px] p-6 text-left hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow] cursor-pointer"
                >
                  <div className="font-bold text-[1.1rem] text-[#333]">🎂 {p.birthday_person_name}</div>
                  <div className="text-[#888] text-[0.9rem] mt-1">{formatDate(p.party_date)}</div>
                  <div className="text-[#ff6b9d] text-[0.85rem] mt-1">1rockstarsocial.com/{p.slug}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              href={`/${hostSlug}`}
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

            <div className="mt-2">
              <button
                onClick={() => { setShowChangePw(!showChangePw); setPwStatus({ type: '', message: '' }); }}
                className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors"
              >
                {showChangePw ? 'Cancel' : 'Change password'}
              </button>

              {showChangePw && (
                <form onSubmit={handleChangePassword} className="mt-3 flex flex-col gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    className="border border-[#ddd] rounded-[8px] px-4 py-2 text-[0.95rem] w-full"
                    minLength={8}
                    required
                  />
                  {pwStatus.message && (
                    <p className={`text-[0.85rem] ${pwStatus.type === 'error' ? 'text-[#c53030]' : 'text-[#276749]'}`}>
                      {pwStatus.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="text-white rounded-[8px] py-2 px-5 font-semibold text-[0.9rem] hover:opacity-90 transition-opacity"
                    style={{ background: color }}
                  >
                    Save new password
                  </button>
                </form>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors mt-1"
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
