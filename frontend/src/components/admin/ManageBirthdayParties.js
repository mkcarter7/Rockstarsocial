'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminEventPages, deleteAdminEventPage } from '../../api/api';
import './ManageBirthdayParties.css';

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

  useEffect(() => {
    loadPages();
  }, [loadPages]);

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
    try {
      await logout();
      router.push('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  if (loading) return <div className="bp-loading">Loading...</div>;

  return (
    <div className="admin-birthday-parties">
      <header className="bp-header">
        <div className="bp-header-left">
          <button className="btn-back" onClick={() => router.push('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>Event Pages</h1>
        </div>
        <div className="bp-header-right">
          <Link href="/" className="btn-home">Home</Link>
          <span>{currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="bp-content">
        {pages.length === 0 ? (
          <p className="bp-empty">No event pages yet.</p>
        ) : (
          <table className="bp-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Web Path</th>
                <th>Host Email</th>
                <th>Event Date</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr
                  key={`${page.event_type}-${page.id}`}
                  className={!page.is_active ? 'row-inactive' : page.is_expired ? 'row-expired' : ''}
                >
                  <td><span className="event-type-tag">{page.event_type}</span></td>
                  <td>{page.name}</td>
                  <td>
                    <a href={`/birthday/${page.slug}`} target="_blank" rel="noreferrer" className="slug-link">
                      /birthday/{page.slug}
                    </a>
                  </td>
                  <td>{page.host_email}</td>
                  <td>{formatDate(page.party_date)}</td>
                  <td>
                    {page.is_expired
                      ? <span className="badge badge-expired">Expired</span>
                      : page.is_active
                        ? <span className="badge badge-active">Active</span>
                        : <span className="badge badge-pending">Pending</span>}
                  </td>
                  <td>{formatDate(page.expires_at)}</td>
                  <td>{formatDate(page.created_at)}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleDelete(page)}>
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
