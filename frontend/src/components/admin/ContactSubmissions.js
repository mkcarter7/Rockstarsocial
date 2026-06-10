'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';

const adminBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";

const ContactSubmissions = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadSubmissions = useCallback(async () => {
    try {
      const token = await getIdToken();
      const response = await api.get('/admin/contact-submissions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleMarkRead = async (id, isRead) => {
    try {
      const token = await getIdToken();
      const action = isRead ? 'mark_unread' : 'mark_read';
      await api.post(`/admin/contact-submissions/${id}/${action}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSubmissions();
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, read: !isRead });
      }
    } catch (err) {
      console.error('Error updating submission:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    try {
      const token = await getIdToken();
      await api.delete(`/admin/contact-submissions/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSubmission && selectedSubmission.id === id) setSelectedSubmission(null);
    } catch (err) {
      console.error('Error deleting submission:', err);
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

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'read') return sub.read;
    if (filter === 'unread') return !sub.read;
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={adminBtnClass} onClick={() => router.push('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1 className="m-0 text-[1.8rem]">Contact Submissions</h1>
        </div>
        <div className="flex items-center gap-5 md:flex-wrap md:justify-center md:w-full">
          <Link href="/" className={adminBtnClass}>Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={adminBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1400px] mx-auto">
        <div className="flex gap-[10px] mb-5">
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`py-[10px] px-5 rounded-[5px] cursor-pointer text-[0.95rem] font-medium transition-all duration-300 border-2 ${
                filter === f ? 'bg-brand text-white border-brand' : 'bg-white border-[#ddd] hover:border-brand'
              }`}
            >
              {f === 'all' && `All (${submissions.length})`}
              {f === 'unread' && `Unread (${submissions.filter(s => !s.read).length})`}
              {f === 'read' && `Read (${submissions.filter(s => s.read).length})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[400px_1fr] lg:grid-cols-1 gap-5 bg-white rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] overflow-hidden">
          <div className="border-r border-[#eee] lg:border-r-0 lg:border-b lg:border-b-[#eee] max-h-[calc(100vh-250px)] lg:max-h-[300px] overflow-y-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="p-10 text-center text-[#999]">
                <p>No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map(submission => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`p-5 border-b border-[#eee] cursor-pointer transition-colors duration-200 hover:bg-[#f9f9f9] ${!submission.read ? 'bg-[#fff5f8] font-medium' : ''} ${selectedSubmission?.id === submission.id ? 'bg-[#f0f0f0] border-l-4 border-l-[#fab3c2]' : ''}`}
                >
                  <div className="flex justify-between items-start mb-[10px]">
                    <div className="flex items-center gap-2 flex-1">
                      {!submission.read && (
                        <span className="bg-brand text-white py-[2px] px-2 rounded-[3px] text-[0.7rem] font-bold">NEW</span>
                      )}
                      <strong>{submission.name}</strong>
                    </div>
                    <span className="text-[0.85rem] text-[#666] whitespace-nowrap">{formatDate(submission.created_at)}</span>
                  </div>
                  <div className="font-semibold mb-[5px] text-[#333]">{submission.subject}</div>
                  <div className="text-[0.85rem] text-[#666]">{submission.email}</div>
                </div>
              ))
            )}
          </div>

          <div className="p-[30px] max-h-[calc(100vh-250px)] lg:max-h-none overflow-y-auto">
            {selectedSubmission ? (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-start pb-5 border-b-2 border-[#eee] md:flex-col md:gap-[15px]">
                  <h2 className="m-0 text-[#333] flex-1">{selectedSubmission.subject}</h2>
                  <div className="flex gap-[10px] md:w-full">
                    <button
                      onClick={() => handleMarkRead(selectedSubmission.id, selectedSubmission.read)}
                      className="py-2 px-4 rounded-[5px] border-none cursor-pointer text-[0.9rem] font-medium transition-all duration-300 bg-brand text-white hover:bg-brand-dark"
                    >
                      {selectedSubmission.read ? 'Mark as Unread' : 'Mark as Read'}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedSubmission.id)}
                      className="py-2 px-4 rounded-[5px] border-none cursor-pointer text-[0.9rem] font-medium transition-all duration-300 bg-[#e53e3e] text-white hover:bg-[#c53030]"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-[120px_1fr] md:grid-cols-1 gap-[10px]">
                    <strong className="text-[#666] font-semibold">From:</strong>
                    <span>{selectedSubmission.name}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] md:grid-cols-1 gap-[10px]">
                    <strong className="text-[#666] font-semibold">Email:</strong>
                    <a href={`mailto:${selectedSubmission.email}`} className="text-brand hover:underline">
                      {selectedSubmission.email}
                    </a>
                  </div>
                  {selectedSubmission.phone && (
                    <div className="grid grid-cols-[120px_1fr] md:grid-cols-1 gap-[10px]">
                      <strong className="text-[#666] font-semibold">Phone:</strong>
                      <a href={`tel:${selectedSubmission.phone}`} className="text-brand hover:underline">
                        {selectedSubmission.phone}
                      </a>
                    </div>
                  )}
                  <div className="grid grid-cols-[120px_1fr] md:grid-cols-1 gap-[10px]">
                    <strong className="text-[#666] font-semibold">Date:</strong>
                    <span>{formatDate(selectedSubmission.created_at)}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] md:grid-cols-1 gap-[10px]">
                    <strong className="text-[#666] font-semibold">Status:</strong>
                    <span className={`inline-block py-1 px-3 rounded-xl text-[0.85rem] font-medium ${selectedSubmission.read ? 'bg-[#e6f7e6] text-[#2d7d2d]' : 'bg-[#fff5f8] text-[#c53030]'}`}>
                      {selectedSubmission.read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#f9f9f9] p-5 rounded-[5px]">
                  <h3 className="m-0 mb-[15px] text-[#333]">Message</h3>
                  <div className="whitespace-pre-wrap leading-relaxed text-[#555]">
                    {selectedSubmission.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#999] text-[1.1rem]">
                <p>Select a submission to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSubmissions;
