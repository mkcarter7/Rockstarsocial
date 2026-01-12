import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/api';
import './ContactSubmissions.css';

const ContactSubmissions = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'read', 'unread'

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
      loadSubmissions(); // Reload to get updated status
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission({ ...selectedSubmission, read: !isRead });
      }
    } catch (err) {
      console.error('Error updating submission:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return;
    }
    try {
      const token = await getIdToken();
      await api.delete(`/admin/contact-submissions/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(submissions.filter(s => s.id !== id));
      if (selectedSubmission && selectedSubmission.id === id) {
        setSelectedSubmission(null);
      }
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="submissions-loading">Loading...</div>;
  }

  return (
    <div className="admin-contact-submissions">
      <header className="submissions-header">
        <div className="submissions-header-left">
          <button 
            className="btn-back"
            onClick={() => navigate('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Contact Submissions</h1>
        </div>
        <div className="submissions-header-right">
          <Link to="/" className="btn-home">Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="submissions-content">
        <div className="submissions-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({submissions.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({submissions.filter(s => !s.read).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({submissions.filter(s => s.read).length})
          </button>
        </div>

        <div className="submissions-layout">
          <div className="submissions-list">
            {filteredSubmissions.length === 0 ? (
              <div className="no-submissions">
                <p>No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map(submission => (
                <div
                  key={submission.id}
                  className={`submission-item ${!submission.read ? 'unread' : ''} ${selectedSubmission?.id === submission.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="submission-item-header">
                    <div className="submission-item-title">
                      {!submission.read && <span className="unread-badge">NEW</span>}
                      <strong>{submission.name}</strong>
                    </div>
                    <span className="submission-date">
                      {formatDate(submission.created_at)}
                    </span>
                  </div>
                  <div className="submission-item-subject">
                    {submission.subject}
                  </div>
                  <div className="submission-item-email">
                    {submission.email}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="submission-detail">
            {selectedSubmission ? (
              <div className="detail-content">
                <div className="detail-header">
                  <h2>{selectedSubmission.subject}</h2>
                  <div className="detail-actions">
                    <button
                      className="btn-mark-read"
                      onClick={() => handleMarkRead(selectedSubmission.id, selectedSubmission.read)}
                    >
                      {selectedSubmission.read ? 'Mark as Unread' : 'Mark as Read'}
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(selectedSubmission.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="detail-info">
                  <div className="info-row">
                    <strong>From:</strong>
                    <span>{selectedSubmission.name}</span>
                  </div>
                  <div className="info-row">
                    <strong>Email:</strong>
                    <a href={`mailto:${selectedSubmission.email}`}>
                      {selectedSubmission.email}
                    </a>
                  </div>
                  {selectedSubmission.phone && (
                    <div className="info-row">
                      <strong>Phone:</strong>
                      <a href={`tel:${selectedSubmission.phone}`}>
                        {selectedSubmission.phone}
                      </a>
                    </div>
                  )}
                  <div className="info-row">
                    <strong>Date:</strong>
                    <span>{formatDate(selectedSubmission.created_at)}</span>
                  </div>
                  <div className="info-row">
                    <strong>Status:</strong>
                    <span className={`status-badge ${selectedSubmission.read ? 'read' : 'unread'}`}>
                      {selectedSubmission.read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                </div>

                <div className="detail-message">
                  <h3>Message</h3>
                  <div className="message-content">
                    {selectedSubmission.message}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
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
