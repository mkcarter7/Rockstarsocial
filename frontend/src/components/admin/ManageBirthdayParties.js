'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminEventPages, deleteAdminEventPage } from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";

const ManageEventPages = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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
                    <a href={`/birthday/${page.slug}`} target="_blank" rel="noreferrer" className="text-brand no-underline font-mono hover:underline">
                      /birthday/{page.slug}
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
