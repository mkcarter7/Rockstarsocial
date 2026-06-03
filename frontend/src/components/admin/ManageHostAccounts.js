'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminHostAccounts, adminResetHostPassword, adminDeleteHostAccount, adminSendMagicLink } from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";

const ManageHostAccounts = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState({ id: null, type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState({ id: null, message: '' });
  const [linkStatus, setLinkStatus] = useState({ id: null, type: '', message: '' });

  const loadAccounts = useCallback(async () => {
    try {
      const token = await getIdToken();
      const res = await getAdminHostAccounts(token);
      setAccounts(res.data);
    } catch (err) {
      console.error('Error loading host accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const openReset = (accountId) => {
    setResetTarget(accountId);
    setNewPassword('');
    setResetStatus({ id: null, type: '', message: '' });
  };

  const handleSendLink = async (accountId) => {
    setLinkStatus({ id: accountId, type: 'loading', message: 'Sending...' });
    try {
      const token = await getIdToken();
      await adminSendMagicLink(accountId, token);
      setLinkStatus({ id: accountId, type: 'success', message: 'Link sent!' });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to send link.';
      setLinkStatus({ id: accountId, type: 'error', message: msg });
    }
  };

  const handleDelete = async (accountId) => {
    setDeleteError({ id: null, message: '' });
    try {
      const token = await getIdToken();
      await adminDeleteHostAccount(accountId, token);
      setDeleteConfirm(null);
      loadAccounts();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to delete account. Please try again.';
      setDeleteError({ id: accountId, message: msg });
      setDeleteConfirm(null);
    }
  };

  const handleResetSubmit = async (e, accountId) => {
    e.preventDefault();
    setResetStatus({ id: null, type: '', message: '' });
    try {
      const token = await getIdToken();
      await adminResetHostPassword(accountId, newPassword, token);
      setResetStatus({ id: accountId, type: 'success', message: 'Password reset successfully.' });
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to reset password. Please try again.';
      setResetStatus({ id: accountId, type: 'error', message: msg });
    }
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <div className="p-10 text-center text-[1.1rem] text-[#666]">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-5">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Host Accounts</h1>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/" className={headerBtnClass}>Home</Link>
          <span>{currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="py-[30px] px-10">
        {accounts.length === 0 ? (
          <p className="text-center text-[#888] text-[1.1rem] mt-[60px]">No host accounts yet.</p>
        ) : (
          <table className="w-full border-collapse bg-white rounded-[8px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[0.9rem]">
            <thead>
              <tr>
                {['Email', 'Created', 'Parties', 'Party Slugs', ''].map(h => (
                  <th key={h} className="bg-[#f0f0f0] py-3 px-4 text-left font-semibold text-[#333] border-b-2 border-[#ddd]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <React.Fragment key={account.id}>
                  <tr>
                    <td className="py-3 px-4 border-b border-[#eee] align-middle font-medium">{account.email}</td>
                    <td className="py-3 px-4 border-b border-[#eee] align-middle">{formatDate(account.created_at)}</td>
                    <td className="py-3 px-4 border-b border-[#eee] align-middle text-center">{account.party_count}</td>
                    <td className="py-3 px-4 border-b border-[#eee] align-middle">
                      <div className="flex flex-wrap gap-1">
                        {account.parties.map(p => (
                          <a
                            key={p.slug}
                            href={`/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[0.8rem] text-brand hover:underline"
                            title={`${p.birthday_person_name} — ${p.is_active ? 'active' : 'inactive'}`}
                          >
                            /{p.slug}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b border-[#eee] align-middle">
                      <div className="flex gap-2 items-center flex-wrap">
                        <button
                          onClick={() => handleSendLink(account.id)}
                          disabled={linkStatus.id === account.id && linkStatus.type === 'loading'}
                          className="bg-[#276749] text-white border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#1f4f37] whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {linkStatus.id === account.id && linkStatus.type === 'loading' ? 'Sending...' : 'Send Login Link'}
                        </button>
                        {linkStatus.id === account.id && linkStatus.type !== 'loading' && (
                          <span className={`text-[0.8rem] ${linkStatus.type === 'error' ? 'text-[#c53030]' : 'text-[#276749]'}`}>
                            {linkStatus.message}
                          </span>
                        )}
                        <button
                          onClick={() => openReset(resetTarget === account.id ? null : account.id)}
                          className="bg-[#6c5ce7] text-white border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#5a4bd1] whitespace-nowrap"
                        >
                          {resetTarget === account.id ? 'Cancel' : 'Reset Password'}
                        </button>
                        {deleteConfirm === account.id ? (
                          <>
                            <span className="text-[0.8rem] text-[#c53030] font-semibold">Delete?</span>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="bg-[#e53e3e] text-white border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#c53030] whitespace-nowrap"
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="bg-[#eee] text-[#555] border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#ddd] whitespace-nowrap"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setDeleteConfirm(account.id); setDeleteError({ id: null, message: '' }); }}
                            className="bg-[#e53e3e] text-white border-none py-[6px] px-[14px] rounded-[4px] cursor-pointer text-[0.85rem] transition-colors duration-200 hover:bg-[#c53030] whitespace-nowrap"
                          >
                            Delete
                          </button>
                        )}
                        {deleteError.id === account.id && (
                          <span className="text-[0.8rem] text-[#c53030]">{deleteError.message}</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {resetTarget === account.id && (
                    <tr>
                      <td colSpan={5} className="bg-[#f9f6ff] px-4 py-4 border-b border-[#eee]">
                        <form
                          onSubmit={(e) => handleResetSubmit(e, account.id)}
                          className="flex items-center gap-3 flex-wrap"
                        >
                          <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="New password (min 8 characters)"
                            minLength={8}
                            required
                            className="border border-[#ddd] rounded-[6px] px-3 py-2 text-[0.9rem] min-w-[260px]"
                          />
                          <button
                            type="submit"
                            className="bg-[#6c5ce7] text-white border-none py-2 px-5 rounded-[6px] cursor-pointer text-[0.9rem] font-semibold hover:bg-[#5a4bd1] transition-colors"
                          >
                            Save
                          </button>
                          {resetStatus.id === account.id && (
                            <span className={`text-[0.85rem] ${resetStatus.type === 'error' ? 'text-[#c53030]' : 'text-[#276749]'}`}>
                              {resetStatus.message}
                            </span>
                          )}
                        </form>
                      </td>
                    </tr>
                  )}

                  {resetStatus.id === account.id && resetTarget !== account.id && (
                    <tr>
                      <td colSpan={5} className="bg-[#f0fff4] px-4 py-2 border-b border-[#eee]">
                        <span className="text-[#276749] text-[0.85rem]">{resetStatus.message}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageHostAccounts;
