'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getHostPartyStats, changeHostPassword, switchHostParty } from '../api/api';

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
          localStorage.removeItem('hostEmail');
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

    if (!token) {
      router.push('/host/login');
      return;
    }

    if (!slug) {
      setLoading(false);
      return;
    }

    const parties = JSON.parse(localStorage.getItem('hostAllParties') || 'null');

    setHostToken(token);
    setHostSlug(slug);

    if (parties && parties.length > 1) {
      setAllParties(parties);
      setLoading(false);
      return;
    }

    loadParty(slug, token);
  }, [router]);

  const pickParty = async (slug) => {
    try {
      const res = await switchHostParty(slug, hostToken);
      const newToken = res.data.session_token;
      localStorage.setItem('hostToken', newToken);
      localStorage.setItem('hostPartySlug', slug);
      setHostToken(newToken);
      setHostSlug(slug);
      setAllParties(null);
      loadParty(slug, newToken);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not switch to that event. Please try again.');
      setLoading(false);
    }
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

  const handleSwitchEvent = () => {
    const parties = JSON.parse(localStorage.getItem('hostAllParties') || '[]');
    setStats(null);
    setAllParties(parties);
  };

  const handleLogout = () => {
    localStorage.removeItem('hostToken');
    localStorage.removeItem('hostPartySlug');
    localStorage.removeItem('hostAllParties');
    localStorage.removeItem('hostEmail');
    router.push('/host/login');
  };

  if (allParties) {
    const formatDate = (d) => {
      const [y, m, day] = d.split('-').map(Number);
      return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <section className="py-[80px] text-center text-white" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c850c0 100%)' }}>
          <div className="container">
            <h1 className="text-[2.2rem] text-white mb-3">Your Events</h1>
            <p className="opacity-90">Select an event to manage.</p>
          </div>
        </section>
        <section className="section">
          <div className="container" style={{ maxWidth: 480 }}>
            <div className="flex flex-col gap-4">
              {allParties.map(p => {
                const isWedding = p.party_type === 'wedding';
                const isBabyShower = p.party_type === 'baby_shower';
                const accentColor = isWedding ? '#c9a96e' : isBabyShower ? '#c17c5a' : '#ff6b9d';
                const icon = isWedding ? '♡' : isBabyShower ? '🍼' : '🎂';
                const eventName = isWedding ? (p.couple_name || 'Wedding')
                  : isBabyShower ? (p.parent_names || 'Baby Shower')
                  : (p.birthday_person_name || 'Birthday');
                const eventDate = p.wedding_date || p.shower_date || p.party_date;
                const urlPrefix = `1rockstarsocial.com/${p.slug}`;
                return (
                  <button
                    key={p.slug}
                    onClick={() => pickParty(p.slug)}
                    className="bg-white rounded-[4px] p-6 text-left hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow] cursor-pointer"
                    style={{ border: `2px solid ${accentColor}` }}
                  >
                    <div className="font-bold text-[1.1rem] text-[#333]">
                      {icon} {eventName}
                    </div>
                    {eventDate && <div className="text-[#888] text-[0.9rem] mt-1">{formatDate(eventDate)}</div>}
                    <div className="text-[0.85rem] mt-1" style={{ color: accentColor }}>{urlPrefix}</div>
                  </button>
                );
              })}
              <Link
                href="/birthday/purchase"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-[#ff6b9d] rounded-[4px] p-5 text-[#ff6b9d] font-semibold hover:bg-[#fff0f7] transition-colors"
              >
                + Create a Birthday Page
              </Link>
              <Link
                href="/wedding/purchase"
                className="flex items-center justify-center gap-2 border-2 border-dashed rounded-[4px] p-5 font-semibold hover:opacity-80 transition-opacity"
                style={{ borderColor: '#c9a96e', color: '#c9a96e' }}
              >
                + Create a Wedding Page
              </Link>
              <Link
                href="/baby-shower/purchase"
                className="flex items-center justify-center gap-2 border-2 border-dashed rounded-[4px] p-5 font-semibold hover:opacity-80 transition-opacity"
                style={{ borderColor: '#c17c5a', color: '#c17c5a' }}
              >
                + Create a Baby Shower Page
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!hostSlug && !loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <section className="py-[80px] text-center text-white" style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c850c0 100%)' }}>
          <div className="container">
            <h1 className="text-[2.2rem] text-white mb-3">Welcome to RockStar Social</h1>
            <p className="opacity-90">You're logged in, but you don't have an active event yet.</p>
          </div>
        </section>
        <section className="section">
          <div className="container" style={{ maxWidth: 480 }}>
            <div className="flex flex-col gap-4 text-center">
              <Link
                href="/birthday/purchase"
                className="flex items-center justify-center gap-2 text-white rounded-[4px] py-4 px-6 font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#ff6b9d' }}
              >
                🎂 Create a Birthday Page
              </Link>
              <Link
                href="/wedding/purchase"
                className="flex items-center justify-center gap-2 text-white rounded-[4px] py-4 px-6 font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#c9a96e' }}
              >
                ♡ Create a Wedding Page
              </Link>
              <Link
                href="/baby-shower/purchase"
                className="flex items-center justify-center gap-2 text-white rounded-[4px] py-4 px-6 font-semibold hover:opacity-90 transition-opacity"
                style={{ background: '#c17c5a' }}
              >
                🍼 Create a Baby Shower Page
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors"
              >
                Log out
              </button>
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

  const isWedding = stats.party_type === 'wedding';
  const isBabyShower = stats.party_type === 'baby_shower';
  const color = isWedding ? '#c9a96e' : isBabyShower ? '#c17c5a' : '#ff6b9d';
  const heroGradient = isWedding
    ? 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)'
    : isBabyShower
    ? 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)'
    : `linear-gradient(135deg, ${color} 0%, #c850c0 100%)`;
  const heroTextColor = (isWedding || isBabyShower) ? '#3d1f0e' : 'white';
  const eventName = isWedding
    ? (stats.couple_name || 'Your Wedding')
    : isBabyShower
    ? (stats.parent_names ? `${stats.parent_names}'s Baby Shower` : 'Your Baby Shower')
    : `${stats.birthday_person_name}'s Party`;
  const eventDate = stats.wedding_date || stats.shower_date || stats.party_date;
  const editUrl = isWedding
    ? `/wedding/setup?session_token=${hostToken}`
    : isBabyShower
    ? `/baby-shower/setup?session_token=${hostToken}`
    : `/birthday/setup?session_token=${hostToken}`;
  const createAnotherUrl = isWedding ? '/wedding/purchase' : isBabyShower ? '/baby-shower/purchase' : '/birthday/purchase';
  const createAnotherLabel = isWedding ? '+ Create Another Wedding Page' : isBabyShower ? '+ Create Another Baby Shower Page' : '+ Create Another Party';

  const formatDate = (d) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section className="py-[70px] text-center" style={{ background: heroGradient }}>
        <div className="container">
          <h1 className="text-[2.2rem] mb-2" style={{ color: heroTextColor }}>
            {isWedding ? '♡' : isBabyShower ? '🍼' : '🎂'} {eventName}
          </h1>
          {eventDate && <p className="text-[1rem]" style={{ color: (isWedding || isBabyShower) ? '#7a5a46' : 'rgba(255,255,255,0.9)' }}>{formatDate(eventDate)}</p>}
          {stats.host_name && (
            <p className="text-[0.9rem] mt-1" style={{ color: (isWedding || isBabyShower) ? '#9a7060' : 'rgba(255,255,255,0.75)' }}>Hosted by {stats.host_name}</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 className="text-center mb-6 text-[#333]">{isWedding ? 'Wedding Stats' : isBabyShower ? 'Baby Shower Stats' : 'Party Stats'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <StatCard icon="✅" label="RSVPs (Yes)" value={stats.rsvp_count} color={color} />
            <StatCard icon="📖" label="Guestbook" value={stats.guestbook_count} color={color} />
            <StatCard icon="📸" label="Photos" value={stats.photo_count} color={color} />
          </div>
          {isWedding && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
              {stats.story_count != null && <StatCard icon="∞" label="Story Moments" value={stats.story_count} color={color} />}
              {stats.song_request_count != null && <StatCard icon="♪" label="Song Requests" value={stats.song_request_count} color={color} />}
            </div>
          )}
          {isBabyShower && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
              {stats.story_count != null && <StatCard icon="🍼" label="Journey Moments" value={stats.story_count} color={color} />}
              {stats.name_suggestion_count != null && <StatCard icon="💝" label="Name Ideas" value={stats.name_suggestion_count} color={color} />}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Link
              href={`/${hostSlug}`}
              className="flex items-center justify-center gap-2 bg-white border-2 rounded-[4px] py-4 px-6 font-semibold text-[#333] hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow]"
              style={{ borderColor: color }}
            >
              {isWedding ? '♡ View Wedding Page' : isBabyShower ? '🍼 View Baby Shower Page' : '🎉 View Party Page'}
            </Link>

            <Link
              href={editUrl}
              className="flex items-center justify-center gap-2 text-white rounded-[4px] py-4 px-6 font-semibold hover:opacity-90 transition-opacity"
              style={{ background: color }}
            >
              {isWedding ? '✦ Manage Wedding (colors, story, FAQ…)' : isBabyShower ? '✦ Manage Baby Shower (colors, journey, trivia…)' : '✏️ Edit Party (colors, message, trivia)'}
            </Link>

            <Link
              href={createAnotherUrl}
              className="flex items-center justify-center gap-2 bg-white border-2 border-dashed rounded-[4px] py-4 px-6 font-semibold transition-colors"
              style={{ borderColor: color, color }}
              onMouseEnter={e => { e.currentTarget.style.background = isBabyShower ? '#fdf3ed' : isWedding ? '#fdf6ec' : '#fff0f7'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
            >
              {createAnotherLabel}
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

            {JSON.parse(localStorage.getItem('hostAllParties') || '[]').length > 1 && (
              <button
                onClick={handleSwitchEvent}
                className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors"
              >
                ← My Events
              </button>
            )}

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
