'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';

const Dashboard = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [testimonialCount, setTestimonialCount] = useState(0);
  const [themeCount, setThemeCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [unreadContactCount, setUnreadContactCount] = useState(0);
  const [birthdayCount, setBirthdayCount] = useState(0);

  const loadDashboardData = useCallback(async () => {
    try {
      const token = await getIdToken();

      const [portfolioRes, testimonialRes, themeRes, contactRes, birthdayRes] = await Promise.allSettled([
        api.get('/admin/portfolio/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/testimonials/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/themes/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/contact-submissions/', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/event-pages/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setPortfolioCount(portfolioRes.value?.data?.length ?? 0);
      setTestimonialCount(testimonialRes.value?.data?.length ?? 0);
      setThemeCount(themeRes.value?.data?.length ?? 0);
      const contacts = contactRes.value?.data ?? [];
      setContactCount(contacts.length);
      setUnreadContactCount(contacts.filter(s => !s.read).length);
      setBirthdayCount(birthdayRes.value?.data?.length ?? 0);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    loadDashboardData();

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [getIdToken, loadDashboardData]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <h1 className="m-0 text-[1.8rem]">Admin Dashboard</h1>
        <div className="flex items-center gap-5">
          <Link href="/" className="bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]">
            Home
          </Link>
          <span>Welcome, {currentUser?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 hover:bg-[rgba(255,255,255,0.3)]"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] md:grid-cols-1 gap-5 mb-10">
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center">
            <h3 className="text-[#666] mb-[15px] text-base font-medium">Portfolio Items</h3>
            <p className="text-[2.5rem] font-bold text-brand m-0">{portfolioCount}</p>
          </div>
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center">
            <h3 className="text-[#666] mb-[15px] text-base font-medium">Testimonials</h3>
            <p className="text-[2.5rem] font-bold text-brand m-0">{testimonialCount}</p>
          </div>
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center">
            <h3 className="text-[#666] mb-[15px] text-base font-medium">Themes</h3>
            <p className="text-[2.5rem] font-bold text-brand m-0">{themeCount}</p>
          </div>
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center">
            <h3 className="text-[#666] mb-[15px] text-base font-medium">Contact Submissions</h3>
            <p className="text-[2.5rem] font-bold text-brand m-0">{contactCount}</p>
            {unreadContactCount > 0 && (
              <p className="text-[0.9rem] text-[#e53e3e] mt-[5px] font-medium">({unreadContactCount} unread)</p>
            )}
          </div>
          <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-center">
            <h3 className="text-[#666] mb-[15px] text-base font-medium">Event Pages</h3>
            <p className="text-[2.5rem] font-bold text-brand m-0">{birthdayCount}</p>
          </div>
        </div>

        <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <h2 className="mb-5 text-[#333]">Quick Actions</h2>
          <div className="flex gap-[15px] flex-wrap">
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/portfolio')}>
              Manage Portfolio
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/testimonials')}>
              Manage Testimonials
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/themes')}>
              Manage Themes
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/contact-submissions')}>
              View Contact Submissions
              {unreadContactCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#e53e3e] text-white rounded-full w-6 h-6 flex items-center justify-center text-[0.75rem] font-bold">
                  {unreadContactCount}
                </span>
              )}
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/site-settings')}>
              Site Settings
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/birthday-parties')}>
              Manage Event Pages
            </button>
            <button className="bg-brand text-white border-none py-3 px-6 rounded-[5px] text-base font-semibold cursor-pointer transition-colors duration-300 relative hover:bg-brand-dark" onClick={() => router.push('/admin/host-accounts')}>
              Host Accounts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
