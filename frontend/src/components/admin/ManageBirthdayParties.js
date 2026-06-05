'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminEventPages, deleteAdminEventPage, adminCreateEventPage } from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";
const inputClass = "w-full border border-[#ddd] rounded-[5px] py-2 px-3 text-[0.95rem] outline-none focus:border-brand";

const EVENT_TYPE_LABELS = {
  birthday: { name: "Birthday Person's Name", date: 'Party Date', nameKey: 'birthday_person_name', dateKey: 'party_date' },
  wedding: { name: "Couple's Names (e.g. Sarah & James)", date: 'Wedding Date', nameKey: 'couple_name', dateKey: 'wedding_date' },
  baby_shower: { name: "Parent(s) Names (e.g. Emma & Jake)", date: 'Shower Date', nameKey: 'parent_names', dateKey: 'shower_date' },
};

const EMPTY_FORM = {
  event_type: 'birthday', slug: '', event_name: '', event_date: '',
  host_name: '', host_email: '', host_password: '', send_welcome_email: false,
};

const ManageEventPages = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const loadPages = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await getAdminEventPages(token);
      setPages(res.data);
    } catch (err) {
      console.error('Error loading event pages:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadPages(); }, [loadPages]);

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete "${page.name}'s" ${page.event_type} page (/${page.slug})? This cannot be undone.`)) return;
    try {
      const token = await getIdToken();
      await deleteAdminEventPage(page.event_type.toLowerCase(), page.id, token);
      setPages(prev => prev.filter(p => !(p.id === page.id && p.event_type === page.event_type)));
    } catch (err) {
      console.error('Error deleting event page:', err);
      alert('Error deleting event page. Please try again.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    try {
      const token = await getIdToken();
      const meta = EVENT_TYPE_LABELS[createForm.event_type];
      const payload = {
        event_type: createForm.event_type,
        slug: createForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
        host_email: createForm.host_email,
        host_name: createForm.host_name,
        send_welcome_email: createForm.send_welcome_email,
        [meta.nameKey]: createForm.event_name,
        [meta.dateKey]: createForm.event_date,
      };
      if (createForm.host_password) payload.host_password = createForm.host_password;

      const res = await adminCreateEventPage(payload, token);
      setCreateSuccess(`Created! Page is live at /${res.data.slug}`);
      setCreateForm(EMPTY_FORM);
      loadPages();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create event page. Please try again.');
    }
    setCreating(false);
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const meta = EVENT_TYPE_LABELS[createForm.event_type];

  if (loading) return <div className="p-10 text-center text-[1.1rem] text-[#666]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-5">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Event Pages</h1>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/" className={headerBtnClass}>Home</Link>
          <span>{currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="py-[30px] px-10">

        {/* Create Event toggle button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => { setShowCreateForm(f => !f); setCreateError(''); setCreateSuccess(''); }}
            className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create Event Page'}
          </button>
        </div>

        {/* Create Event form */}
        {showCreateForm && (
          <div className="bg-white rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.1)] p-8 mb-8">
            <h2 className="text-[1.3rem] font-semibold text-[#333] mb-6">Create Event Page (no Stripe)</h2>

            {createError && (
              <div className="py-3 px-4 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181] text-[0.9rem]">{createError}</div>
            )}
            {createSuccess && (
              <div className="py-3 px-4 rounded-[5px] mb-5 bg-[#d4edda] text-[#155724] border border-[#c3e6cb] text-[0.9rem]">✓ {createSuccess}</div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">Event Type *</label>
                <select value={createForm.event_type} onChange={e => setCreateForm(p => ({ ...p, event_type: e.target.value }))} className={inputClass}>
                  <option value="birthday">Birthday Party</option>
                  <option value="wedding">Wedding</option>
                  <option value="baby_shower">Baby Shower</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">Page URL Slug *</label>
                <div className="flex items-center border border-[#ddd] rounded-[5px] overflow-hidden focus-within:border-brand">
                  <span className="bg-[#f5f5f5] px-3 py-2 text-[0.85rem] text-[#888] border-r border-[#ddd] whitespace-nowrap">rockstarsocial.com/</span>
                  <input type="text" value={createForm.slug}
                    onChange={e => setCreateForm(p => ({ ...p, slug: e.target.value }))}
                    placeholder="kims-party" required
                    className="flex-1 py-2 px-3 text-[0.95rem] outline-none border-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">{meta.name} *</label>
                <input type="text" value={createForm.event_name}
                  onChange={e => setCreateForm(p => ({ ...p, event_name: e.target.value }))}
                  placeholder={meta.name} required className={inputClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">{meta.date} *</label>
                <input type="date" value={createForm.event_date}
                  onChange={e => setCreateForm(p => ({ ...p, event_date: e.target.value }))}
                  required className={inputClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">Host Name</label>
                <input type="text" value={createForm.host_name}
                  onChange={e => setCreateForm(p => ({ ...p, host_name: e.target.value }))}
                  placeholder="Full name" className={inputClass} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[0.85rem] text-[#444]">Host Email *</label>
                <input type="email" value={createForm.host_email}
                  onChange={e => setCreateForm(p => ({ ...p, host_email: e.target.value }))}
                  placeholder="host@email.com" required className={inputClass} />
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="font-semibold text-[0.85rem] text-[#444]">Host Password <span className="font-normal text-[#888]">(optional)</span></label>
                <input type="text" value={createForm.host_password}
                  onChange={e => setCreateForm(p => ({ ...p, host_password: e.target.value }))}
                  placeholder="Leave blank to auto-generate. Host can reset via magic link." className={inputClass} />
              </div>

              <div className="flex items-center gap-3 md:col-span-2">
                <input type="checkbox" id="sendEmail" checked={createForm.send_welcome_email}
                  onChange={e => setCreateForm(p => ({ ...p, send_welcome_email: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer" />
                <label htmlFor="sendEmail" className="text-[0.9rem] text-[#444] cursor-pointer">
                  Send welcome email to host with their page link
                </label>
              </div>

              <div className="md:col-span-2">
                <button type="submit"
                  className="bg-brand text-white border-none py-3 px-8 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={creating}>
                  {creating ? 'Creating...' : 'Create Event Page'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Event pages table */}
        {pages.length === 0 ? (
          <p className="text-center text-[#888] text-[1.1rem] mt-[60px]">No event pages yet.</p>
        ) : (
          <table className="w-full border-collapse bg-white rounded-[8px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[0.9rem]">
            <thead>
              <tr>
                {['Type', 'Name', 'Web Path', 'Host Email', 'Event Date', 'Status', 'Expires', 'Created', ''].map(h => (
                  <th key={h} className="bg-[#f0f0f0] py-3 px-4 text-left font-semibold text-[#333] border-b-2 border-[#ddd]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr
                  key={`${page.event_type}-${page.id}`}
                  className={`${!page.is_active ? 'opacity-60' : ''} ${page.is_expired ? '[&>td]:bg-[#fff8f8]' : ''}`}
                >
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">
                    <span className="inline-block py-[3px] px-[10px] rounded-xl text-[0.78rem] font-semibold bg-[#e8d5f5] text-[#5b21b6]">{page.event_type}</span>
                  </td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">{page.name}</td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">
                    <a href={`/${page.slug}`} target="_blank" rel="noreferrer" className="text-brand no-underline font-mono hover:underline">
                      /{page.slug}
                    </a>
                  </td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">{page.host_email}</td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">{formatDate(page.party_date)}</td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">
                    {page.is_expired
                      ? <span className="inline-block py-[3px] px-[10px] rounded-xl text-[0.78rem] font-semibold bg-[#f8d7da] text-[#721c24]">Expired</span>
                      : page.is_active
                        ? <span className="inline-block py-[3px] px-[10px] rounded-xl text-[0.78rem] font-semibold bg-[#d4edda] text-[#155724]">Active</span>
                        : <span className="inline-block py-[3px] px-[10px] rounded-xl text-[0.78rem] font-semibold bg-[#fff3cd] text-[#856404]">Pending</span>}
                  </td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">{formatDate(page.expires_at)}</td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">{formatDate(page.created_at)}</td>
                  <td className="py-3 px-4 border-b border-[#eee] align-middle">
                    <button
                      onClick={() => handleDelete(page)}
                      className="bg-[#e74c3c] text-white border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#c0392b]"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageEventPages;
