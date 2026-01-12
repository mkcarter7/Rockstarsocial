import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [testimonialCount, setTestimonialCount] = useState(0);
  const [themeCount, setThemeCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [unreadContactCount, setUnreadContactCount] = useState(0);

  useEffect(() => {
    // Set up axios interceptor to add Firebase token to requests
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Load dashboard data
    loadDashboardData();

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await getIdToken();
      
      // Fetch counts from admin API
      const [portfolioRes, testimonialRes, themeRes, contactRes] = await Promise.all([
        api.get('/admin/portfolio/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/testimonials/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/themes/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/contact-submissions/', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setPortfolioCount(portfolioRes.data.length);
      setTestimonialCount(testimonialRes.data.length);
      setThemeCount(themeRes.data.length);
      setContactCount(contactRes.data.length);
      setUnreadContactCount(contactRes.data.filter(s => !s.read).length);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-user">
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Portfolio Items</h3>
            <p className="stat-number">{portfolioCount}</p>
          </div>
          <div className="stat-card">
            <h3>Testimonials</h3>
            <p className="stat-number">{testimonialCount}</p>
          </div>
          <div className="stat-card">
            <h3>Themes</h3>
            <p className="stat-number">{themeCount}</p>
          </div>
          <div className="stat-card">
            <h3>Contact Submissions</h3>
            <p className="stat-number">{contactCount}</p>
            {unreadContactCount > 0 && (
              <p className="stat-badge">({unreadContactCount} unread)</p>
            )}
          </div>
        </div>

        <div className="dashboard-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/portfolio')}
            >
              Manage Portfolio
            </button>
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/testimonials')}
            >
              Manage Testimonials
            </button>
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/themes')}
            >
              Manage Themes
            </button>
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/contact-submissions')}
            >
              View Contact Submissions
              {unreadContactCount > 0 && (
                <span className="action-badge">{unreadContactCount}</span>
              )}
            </button>
            <button 
              className="btn-action"
              onClick={() => navigate('/admin/site-settings')}
            >
              Site Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
