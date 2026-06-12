'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getHostPartyStats, changeHostPassword, switchHostParty,
  checkBirthdaySlug, checkWeddingSlug, checkBabyShowerSlug,
  updateBirthdaySlug, updateWeddingSlug, updateBabyShowerSlug,
  getBabyShowerRSVP,
  getBabyShowerSchedule, addBabyShowerScheduleItem, deleteBabyShowerScheduleItem,
  getBabyShowerChecklist, addBabyShowerChecklistItem, updateBabyShowerChecklistItem, deleteBabyShowerChecklistItem,
  updateBabyShowerEventField,
  getBabyShowerDelegations, addBabyShowerDelegation, updateBabyShowerDelegation, deleteBabyShowerDelegation,
  getBabyShowerVendors, addBabyShowerVendor, deleteBabyShowerVendor,
  getBabyShowerThankYous, addBabyShowerThankYou, updateBabyShowerThankYou, deleteBabyShowerThankYou,
} from '../api/api';
import BabyShowerBudgetTracker from './BabyShowerBudgetTracker';

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
  const [showChangeUrl, setShowChangeUrl] = useState(false);
  const [newUrlSlug, setNewUrlSlug] = useState('');
  const [urlStatus, setUrlStatus] = useState({ type: '', message: '' });
  const [urlCheckTimer, setUrlCheckTimer] = useState(null);

  // Baby shower planning state
  const [rsvps, setRsvps] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newChecklistTimeframe, setNewChecklistTimeframe] = useState('');

  // Pinterest board
  const [editingPinterest, setEditingPinterest] = useState(false);
  const [pinterestInput, setPinterestInput] = useState('');

  // Host notes
  const [notesInput, setNotesInput] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Delegation
  const [delegations, setDelegations] = useState([]);
  const [newDelegationPerson, setNewDelegationPerson] = useState('');
  const [newDelegationTask, setNewDelegationTask] = useState('');
  const [newDelegationNotes, setNewDelegationNotes] = useState('');

  // Vendor contacts
  const [vendors, setVendors] = useState([]);
  const [newVendorRole, setNewVendorRole] = useState('');
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorNotes, setNewVendorNotes] = useState('');

  // Thank-you tracker
  const [thankYous, setThankYous] = useState([]);
  const [newThankYouGiver, setNewThankYouGiver] = useState('');
  const [newThankYouGift, setNewThankYouGift] = useState('');

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

  useEffect(() => {
    if (!stats || !hostToken || !hostSlug || stats.party_type !== 'baby_shower') return;
    getBabyShowerRSVP(hostSlug).then(res => setRsvps(res.data.entries || [])).catch(() => {});
    getBabyShowerSchedule(hostSlug).then(res => setSchedule(res.data || [])).catch(() => {});
    getBabyShowerChecklist(hostSlug, hostToken).then(res => setChecklist(res.data || [])).catch(() => {});
    getBabyShowerDelegations(hostSlug, hostToken).then(res => setDelegations(res.data || [])).catch(() => {});
    getBabyShowerVendors(hostSlug, hostToken).then(res => setVendors(res.data || [])).catch(() => {});
    getBabyShowerThankYous(hostSlug, hostToken).then(res => setThankYous(res.data || [])).catch(() => {});
    if (stats.pinterest_board_url) setPinterestInput(stats.pinterest_board_url);
    if (stats.host_notes) setNotesInput(stats.host_notes);
  }, [stats, hostToken, hostSlug]);

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

  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const handleUrlInput = (val) => {
    setNewUrlSlug(val);
    setUrlStatus({ type: '', message: '' });
    if (urlCheckTimer) clearTimeout(urlCheckTimer);
    const slug = val.trim().toLowerCase();
    if (!slug || slug === hostSlug) return;
    if (!SLUG_REGEX.test(slug)) {
      setUrlStatus({ type: 'error', message: 'Only lowercase letters, numbers, and hyphens.' });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const isWeddingLocal = stats?.party_type === 'wedding';
        const isBabyShowerLocal = stats?.party_type === 'baby_shower';
        const checkFn = isWeddingLocal ? checkWeddingSlug : isBabyShowerLocal ? checkBabyShowerSlug : checkBirthdaySlug;
        const res = await checkFn(slug);
        if (res.data.available) {
          setUrlStatus({ type: 'success', message: 'Available!' });
        } else {
          setUrlStatus({ type: 'error', message: 'Already taken. Please choose another.' });
        }
      } catch {
        // ignore check errors
      }
    }, 400);
    setUrlCheckTimer(timer);
  };

  const handleChangeUrl = async (e) => {
    e.preventDefault();
    setUrlStatus({ type: '', message: '' });
    const slug = newUrlSlug.trim().toLowerCase();
    if (!slug) {
      setUrlStatus({ type: 'error', message: 'Please enter a new URL.' });
      return;
    }
    if (slug === hostSlug) {
      setUrlStatus({ type: 'error', message: 'That is already your current URL.' });
      return;
    }
    if (!SLUG_REGEX.test(slug)) {
      setUrlStatus({ type: 'error', message: 'Only lowercase letters, numbers, and hyphens.' });
      return;
    }
    try {
      const isWeddingLocal = stats?.party_type === 'wedding';
      const isBabyShowerLocal = stats?.party_type === 'baby_shower';
      const updateFn = isWeddingLocal ? updateWeddingSlug : isBabyShowerLocal ? updateBabyShowerSlug : updateBirthdaySlug;
      await updateFn(hostSlug, slug, hostToken);
      localStorage.setItem('hostPartySlug', slug);
      const allParties = JSON.parse(localStorage.getItem('hostAllParties') || '[]');
      const updated = allParties.map(p => p.slug === hostSlug ? { ...p, slug } : p);
      localStorage.setItem('hostAllParties', JSON.stringify(updated));
      setHostSlug(slug);
      setShowChangeUrl(false);
      setNewUrlSlug('');
      setUrlStatus({ type: '', message: '' });
      router.replace(`/${slug}`);
    } catch (err) {
      setUrlStatus({ type: 'error', message: err?.response?.data?.error || 'Could not update URL. Please try again.' });
    }
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
                    className="bg-white rounded-[4px] p-3 text-left hover:-translate-y-[2px] hover:shadow-md transition-[transform,box-shadow] cursor-pointer"
                    style={{ border: `2px solid ${accentColor}` }}
                  >
                    <div className="font-bold text-[0.85rem] text-[#333]">
                      {icon} {eventName}
                    </div>
                    {eventDate && <div className="text-[#888] text-[0.75rem] mt-0.5">{formatDate(eventDate)}</div>}
                    <div className="text-[0.7rem] mt-0.5" style={{ color: accentColor }}>{urlPrefix}</div>
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

          {isBabyShower && (
            <>
              {/* ── RSVP List ── */}
              <div className="mb-10">
                <h3 className="text-[1.2rem] font-semibold text-[#333] mb-4">Guest RSVPs</h3>
                {rsvps.length === 0 ? (
                  <p className="text-[#999] text-sm">No RSVPs yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ background: `${color}15` }}>
                          <th className="text-left px-3 py-2 font-semibold text-[#555]">Name</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#555]">Status</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#555]">Guests</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#555]">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rsvps.map(r => (
                          <tr key={r.id} className="border-b last:border-0">
                            <td className="px-3 py-2 font-medium">{r.name}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                r.status === 'yes' ? 'bg-green-100 text-green-700' :
                                r.status === 'no' ? 'bg-red-100 text-red-600' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {r.status === 'yes' ? 'Yes' : r.status === 'no' ? 'No' : 'Maybe'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">{r.guest_count}</td>
                            <td className="px-3 py-2 text-[#666]">{r.message || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Planning Checklist ── */}
              <div className="mb-10">
                <h3 className="text-[1.2rem] font-semibold text-[#333] mb-4">Planning Checklist</h3>
                {checklist.length === 0 ? (
                  <p className="text-[#999] text-sm">Loading checklist…</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {[...new Set(checklist.map(c => c.timeframe))].map(tf => (
                      <div key={tf}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#aaa] mb-2">{tf}</p>
                        <div className="flex flex-col gap-1">
                          {checklist.filter(c => c.timeframe === tf).map(item => (
                            <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded accent-[var(--theme)] flex-shrink-0"
                                style={{ accentColor: color }}
                                checked={item.is_completed}
                                onChange={async () => {
                                  const updated = { ...item, is_completed: !item.is_completed };
                                  setChecklist(prev => prev.map(c => c.id === item.id ? updated : c));
                                  try {
                                    await updateBabyShowerChecklistItem(hostSlug, item.id, { session_token: hostToken, is_completed: !item.is_completed });
                                  } catch { setChecklist(prev => prev.map(c => c.id === item.id ? item : c)); }
                                }}
                              />
                              <span className={`text-sm ${item.is_completed ? 'line-through text-[#aaa]' : 'text-[#444]'}`}>{item.text}</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await deleteBabyShowerChecklistItem(hostSlug, item.id, hostToken);
                                    setChecklist(prev => prev.filter(c => c.id !== item.id));
                                  } catch { /* ignore */ }
                                }}
                                className="ml-auto opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 text-lg leading-none flex-shrink-0"
                              >×</button>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <form
                  className="mt-4 flex gap-2 flex-wrap"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!newChecklistText.trim()) return;
                    try {
                      const res = await addBabyShowerChecklistItem(hostSlug, {
                        session_token: hostToken,
                        timeframe: newChecklistTimeframe.trim() || 'Custom',
                        text: newChecklistText.trim(),
                      });
                      setChecklist(prev => [...prev, res.data]);
                      setNewChecklistText('');
                      setNewChecklistTimeframe('');
                    } catch { /* ignore */ }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Task"
                    className="border rounded px-3 py-2 text-sm flex-1 min-w-0"
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Timeframe (optional)"
                    className="border rounded px-3 py-2 text-sm w-44"
                    value={newChecklistTimeframe}
                    onChange={e => setNewChecklistTimeframe(e.target.value)}
                  />
                  <button type="submit" className="text-white px-4 py-2 rounded text-sm font-medium" style={{ background: color }}>
                    + Add
                  </button>
                </form>
              </div>

              {/* ── Day-of Schedule ── */}
              <div className="mb-10">
                <h3 className="text-[1.2rem] font-semibold text-[#333] mb-4">Day-of Schedule</h3>
                {schedule.length === 0 ? (
                  <p className="text-[#999] text-sm mb-4">No schedule items yet — build your run-of-show below.</p>
                ) : (
                  <div className="flex flex-col gap-2 mb-4">
                    {schedule.map(item => (
                      <div key={item.id} className="flex items-start gap-3 group rounded-lg p-3 border border-gray-100 bg-white">
                        {item.time_label && (
                          <span className="text-xs font-mono font-semibold pt-0.5 whitespace-nowrap" style={{ color }}>{item.time_label}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#333]">{item.title}</p>
                          {item.description && <p className="text-xs text-[#888] mt-0.5">{item.description}</p>}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await deleteBabyShowerScheduleItem(hostSlug, item.id, hostToken);
                              setSchedule(prev => prev.filter(s => s.id !== item.id));
                            } catch { /* ignore */ }
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 text-lg leading-none flex-shrink-0"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <form
                  className="flex gap-2 flex-wrap"
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!newScheduleTitle.trim()) return;
                    try {
                      const res = await addBabyShowerScheduleItem(hostSlug, {
                        session_token: hostToken,
                        time_label: newScheduleTime.trim(),
                        title: newScheduleTitle.trim(),
                      });
                      setSchedule(prev => [...prev, res.data]);
                      setNewScheduleTitle('');
                      setNewScheduleTime('');
                    } catch { /* ignore */ }
                  }}
                >
                  <input
                    type="text"
                    placeholder="Time (e.g. 10:00 AM)"
                    className="border rounded px-3 py-2 text-sm w-36"
                    value={newScheduleTime}
                    onChange={e => setNewScheduleTime(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Activity (e.g. Guests Arrive)"
                    className="border rounded px-3 py-2 text-sm flex-1 min-w-0"
                    value={newScheduleTitle}
                    onChange={e => setNewScheduleTitle(e.target.value)}
                  />
                  <button type="submit" className="text-white px-4 py-2 rounded text-sm font-medium" style={{ background: color }}>
                    + Add
                  </button>
                </form>
              </div>

              {/* ── Budget Tracker ── */}
              <BabyShowerBudgetTracker slug={hostSlug} sessionToken={hostToken} themeColor={color} />

              {/* ── Pinterest Board ── */}
              <div className="bg-white rounded-[12px] border border-[#e8e0d8] p-6">
                <h3 className="text-[1rem] font-bold uppercase tracking-widest mb-4" style={{ color }}>Pinterest Board</h3>
                {!editingPinterest ? (
                  <div className="flex items-center gap-3">
                    {stats.pinterest_board_url ? (
                      <>
                        <a href={stats.pinterest_board_url} target="_blank" rel="noopener noreferrer"
                          className="text-[0.9rem] underline truncate flex-1" style={{ color }}>
                          {stats.pinterest_board_url}
                        </a>
                        <button onClick={() => { setPinterestInput(stats.pinterest_board_url); setEditingPinterest(true); }}
                          className="text-[0.8rem] px-3 py-1 border rounded" style={{ borderColor: color, color }}>
                          Edit
                        </button>
                      </>
                    ) : (
                      <button onClick={() => { setPinterestInput(''); setEditingPinterest(true); }}
                        className="text-[0.85rem] px-4 py-2 rounded text-white" style={{ background: color }}>
                        + Add Pinterest board link
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={async e => {
                    e.preventDefault();
                    try {
                      await updateBabyShowerEventField(hostSlug, { pinterest_board_url: pinterestInput }, hostToken);
                      setStats(prev => ({ ...prev, pinterest_board_url: pinterestInput }));
                      setEditingPinterest(false);
                    } catch {}
                  }} className="flex gap-2 items-center">
                    <input value={pinterestInput} onChange={e => setPinterestInput(e.target.value)}
                      placeholder="https://pinterest.com/yourboard"
                      className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[0.9rem]" />
                    <button type="submit" className="px-4 py-2 rounded text-white text-[0.85rem]" style={{ background: color }}>Save</button>
                    <button type="button" onClick={() => setEditingPinterest(false)}
                      className="px-3 py-2 rounded border border-[#ddd] text-[0.85rem] text-[#666]">Cancel</button>
                  </form>
                )}
              </div>

              {/* ── Host Notes ── */}
              <div className="bg-white rounded-[12px] border border-[#e8e0d8] p-6">
                <h3 className="text-[1rem] font-bold uppercase tracking-widest mb-4" style={{ color }}>Host Notes</h3>
                <p className="text-[0.8rem] text-[#999] mb-3">Private reminders, venue codes, pickup times — only you can see this.</p>
                <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)}
                  placeholder="e.g. Arrive by 9am · Venue door code: 4821 · Put ice in cooler 1 hour before"
                  rows={4}
                  className="w-full border border-[#ddd] rounded px-3 py-2 text-[0.9rem] resize-y" />
                <button onClick={async () => {
                  setNotesSaving(true);
                  try {
                    await updateBabyShowerEventField(hostSlug, { host_notes: notesInput }, hostToken);
                    setStats(prev => ({ ...prev, host_notes: notesInput }));
                  } catch {}
                  setNotesSaving(false);
                }} className="mt-2 px-4 py-2 rounded text-white text-[0.85rem]" style={{ background: color }}>
                  {notesSaving ? 'Saving…' : 'Save Notes'}
                </button>
              </div>

              {/* ── Who's Handling What (Delegation) ── */}
              <div className="bg-white rounded-[12px] border border-[#e8e0d8] p-6">
                <h3 className="text-[1rem] font-bold uppercase tracking-widest mb-4" style={{ color }}>Who's Handling What</h3>
                {delegations.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[0.85rem]">
                      <thead>
                        <tr className="text-left text-[#888] text-[0.75rem] uppercase border-b border-[#f0e8e0]">
                          <th className="py-2 pr-4">Who</th>
                          <th className="py-2 pr-4">Task</th>
                          <th className="py-2 pr-4">Notes</th>
                          <th className="py-2 pr-4 text-center">Confirmed</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {delegations.map(d => (
                          <tr key={d.id} className="border-b border-[#f8f4f0]">
                            <td className="py-2 pr-4 font-medium">{d.person_name}</td>
                            <td className="py-2 pr-4">{d.task}</td>
                            <td className="py-2 pr-4 text-[#888]">{d.notes}</td>
                            <td className="py-2 pr-4 text-center">
                              <input type="checkbox" checked={d.is_confirmed} onChange={async () => {
                                const updated = !d.is_confirmed;
                                setDelegations(prev => prev.map(x => x.id === d.id ? { ...x, is_confirmed: updated } : x));
                                try {
                                  await updateBabyShowerDelegation(hostSlug, d.id, { session_token: hostToken, is_confirmed: updated });
                                } catch {
                                  setDelegations(prev => prev.map(x => x.id === d.id ? { ...x, is_confirmed: d.is_confirmed } : x));
                                }
                              }} />
                            </td>
                            <td className="py-2">
                              <button onClick={async () => {
                                try {
                                  await deleteBabyShowerDelegation(hostSlug, d.id, hostToken);
                                  setDelegations(prev => prev.filter(x => x.id !== d.id));
                                } catch {}
                              }} className="text-[#bbb] hover:text-red-400 text-[1rem] leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!newDelegationPerson.trim() || !newDelegationTask.trim()) return;
                  try {
                    const res = await addBabyShowerDelegation(hostSlug, {
                      session_token: hostToken,
                      person_name: newDelegationPerson.trim(),
                      task: newDelegationTask.trim(),
                      notes: newDelegationNotes.trim(),
                    });
                    setDelegations(prev => [...prev, res.data]);
                    setNewDelegationPerson(''); setNewDelegationTask(''); setNewDelegationNotes('');
                  } catch {}
                }} className="flex flex-wrap gap-2 items-end">
                  <input value={newDelegationPerson} onChange={e => setNewDelegationPerson(e.target.value)}
                    placeholder="Who (e.g. Sarah)" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-36" />
                  <input value={newDelegationTask} onChange={e => setNewDelegationTask(e.target.value)}
                    placeholder="Task (e.g. Punch)" className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[0.85rem] min-w-[140px]" />
                  <input value={newDelegationNotes} onChange={e => setNewDelegationNotes(e.target.value)}
                    placeholder="Notes (optional)" className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[0.85rem] min-w-[140px]" />
                  <button type="submit" className="px-4 py-2 rounded text-white text-[0.85rem] whitespace-nowrap" style={{ background: color }}>
                    + Add
                  </button>
                </form>
              </div>

              {/* ── Vendor Contacts ── */}
              <div className="bg-white rounded-[12px] border border-[#e8e0d8] p-6">
                <h3 className="text-[1rem] font-bold uppercase tracking-widest mb-4" style={{ color }}>Vendor Contacts</h3>
                {vendors.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[0.85rem]">
                      <thead>
                        <tr className="text-left text-[#888] text-[0.75rem] uppercase border-b border-[#f0e8e0]">
                          <th className="py-2 pr-4">Role</th>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Phone</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Notes</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors.map(v => (
                          <tr key={v.id} className="border-b border-[#f8f4f0]">
                            <td className="py-2 pr-4 font-medium">{v.role}</td>
                            <td className="py-2 pr-4">{v.name}</td>
                            <td className="py-2 pr-4">
                              {v.phone ? <a href={`tel:${v.phone}`} className="underline" style={{ color }}>{v.phone}</a> : '—'}
                            </td>
                            <td className="py-2 pr-4">
                              {v.email ? <a href={`mailto:${v.email}`} className="underline" style={{ color }}>{v.email}</a> : '—'}
                            </td>
                            <td className="py-2 pr-4 text-[#888]">{v.notes || '—'}</td>
                            <td className="py-2">
                              <button onClick={async () => {
                                try {
                                  await deleteBabyShowerVendor(hostSlug, v.id, hostToken);
                                  setVendors(prev => prev.filter(x => x.id !== v.id));
                                } catch {}
                              }} className="text-[#bbb] hover:text-red-400 text-[1rem] leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!newVendorRole.trim() || !newVendorName.trim()) return;
                  try {
                    const res = await addBabyShowerVendor(hostSlug, {
                      session_token: hostToken,
                      role: newVendorRole.trim(),
                      name: newVendorName.trim(),
                      phone: newVendorPhone.trim(),
                      email: newVendorEmail.trim(),
                      notes: newVendorNotes.trim(),
                    });
                    setVendors(prev => [...prev, res.data]);
                    setNewVendorRole(''); setNewVendorName(''); setNewVendorPhone('');
                    setNewVendorEmail(''); setNewVendorNotes('');
                  } catch {}
                }} className="flex flex-wrap gap-2 items-end">
                  <input value={newVendorRole} onChange={e => setNewVendorRole(e.target.value)}
                    placeholder="Role (e.g. Baker)" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-32" />
                  <input value={newVendorName} onChange={e => setNewVendorName(e.target.value)}
                    placeholder="Name / Business" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-40" />
                  <input value={newVendorPhone} onChange={e => setNewVendorPhone(e.target.value)}
                    placeholder="Phone" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-32" />
                  <input value={newVendorEmail} onChange={e => setNewVendorEmail(e.target.value)}
                    placeholder="Email (optional)" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-44" />
                  <input value={newVendorNotes} onChange={e => setNewVendorNotes(e.target.value)}
                    placeholder="Notes (optional)" className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[0.85rem] min-w-[120px]" />
                  <button type="submit" className="px-4 py-2 rounded text-white text-[0.85rem] whitespace-nowrap" style={{ background: color }}>
                    + Add
                  </button>
                </form>
              </div>

              {/* ── Thank-You Tracker ── */}
              <div className="bg-white rounded-[12px] border border-[#e8e0d8] p-6">
                <h3 className="text-[1rem] font-bold uppercase tracking-widest mb-4" style={{ color }}>Thank-You Tracker</h3>
                <p className="text-[0.8rem] text-[#999] mb-3">Track who gave gifts and whether you've sent a thank-you card.</p>
                {thankYous.length > 0 && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-[0.85rem]">
                      <thead>
                        <tr className="text-left text-[#888] text-[0.75rem] uppercase border-b border-[#f0e8e0]">
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Gift</th>
                          <th className="py-2 pr-4 text-center">Thank You Sent</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {thankYous.map(t => (
                          <tr key={t.id} className="border-b border-[#f8f4f0]">
                            <td className="py-2 pr-4 font-medium">{t.giver_name}</td>
                            <td className="py-2 pr-4 text-[#888]">{t.gift_description || '—'}</td>
                            <td className="py-2 pr-4 text-center">
                              <input type="checkbox" checked={t.thank_you_sent} onChange={async () => {
                                const updated = !t.thank_you_sent;
                                setThankYous(prev => prev.map(x => x.id === t.id ? { ...x, thank_you_sent: updated } : x));
                                try {
                                  await updateBabyShowerThankYou(hostSlug, t.id, { session_token: hostToken, thank_you_sent: updated });
                                } catch {
                                  setThankYous(prev => prev.map(x => x.id === t.id ? { ...x, thank_you_sent: t.thank_you_sent } : x));
                                }
                              }} />
                            </td>
                            <td className="py-2">
                              <button onClick={async () => {
                                try {
                                  await deleteBabyShowerThankYou(hostSlug, t.id, hostToken);
                                  setThankYous(prev => prev.filter(x => x.id !== t.id));
                                } catch {}
                              }} className="text-[#bbb] hover:text-red-400 text-[1rem] leading-none">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <form onSubmit={async e => {
                  e.preventDefault();
                  if (!newThankYouGiver.trim()) return;
                  try {
                    const res = await addBabyShowerThankYou(hostSlug, {
                      session_token: hostToken,
                      giver_name: newThankYouGiver.trim(),
                      gift_description: newThankYouGift.trim(),
                    });
                    setThankYous(prev => [...prev, res.data]);
                    setNewThankYouGiver(''); setNewThankYouGift('');
                  } catch {}
                }} className="flex gap-2 items-end">
                  <input value={newThankYouGiver} onChange={e => setNewThankYouGiver(e.target.value)}
                    placeholder="Name" className="border border-[#ddd] rounded px-3 py-2 text-[0.85rem] w-40" />
                  <input value={newThankYouGift} onChange={e => setNewThankYouGift(e.target.value)}
                    placeholder="Gift (optional)" className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[0.85rem]" />
                  <button type="submit" className="px-4 py-2 rounded text-white text-[0.85rem] whitespace-nowrap" style={{ background: color }}>
                    + Add
                  </button>
                </form>
              </div>
            </>
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

            <div className="mt-2">
              <button
                onClick={() => { setShowChangeUrl(!showChangeUrl); setNewUrlSlug(hostSlug); setUrlStatus({ type: '', message: '' }); }}
                className="text-[#999] text-[0.9rem] underline hover:text-[#666] transition-colors"
              >
                {showChangeUrl ? 'Cancel' : 'Change event URL'}
              </button>

              {showChangeUrl && (
                <form onSubmit={handleChangeUrl} className="mt-3 flex flex-col gap-2">
                  <p className="text-[0.8rem] text-[#888]">
                    Current: <span className="font-mono">rockstarsocial.com/{hostSlug}</span>
                  </p>
                  <p className="text-[0.75rem] text-[#aaa]">
                    Guests with the old URL will be redirected automatically.
                  </p>
                  <div className="flex items-center gap-1 border border-[#ddd] rounded-[8px] px-3 py-2 text-[0.95rem] bg-white">
                    <span className="text-[#bbb] select-none">rockstarsocial.com/</span>
                    <input
                      type="text"
                      value={newUrlSlug}
                      onChange={e => handleUrlInput(e.target.value)}
                      placeholder="new-event-url"
                      className="flex-1 outline-none bg-transparent"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  {urlStatus.message && (
                    <p className={`text-[0.85rem] ${urlStatus.type === 'error' ? 'text-[#c53030]' : 'text-[#276749]'}`}>
                      {urlStatus.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="text-white rounded-[8px] py-2 px-5 font-semibold text-[0.9rem] hover:opacity-90 transition-opacity"
                    style={{ background: color }}
                  >
                    Save new URL
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
