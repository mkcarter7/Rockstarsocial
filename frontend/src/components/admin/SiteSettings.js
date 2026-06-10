'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';

const headerBtnClass = "bg-[rgba(255,255,255,0.2)] text-white border border-[rgba(255,255,255,0.3)] py-2 px-4 rounded-[5px] cursor-pointer text-[0.9rem] transition-colors duration-300 inline-block hover:bg-[rgba(255,255,255,0.3)]";

const COLOR_FIELDS = [
  { id: 'primary-color', field: 'primary_color', label: 'Primary Color', placeholder: '#fab3c2' },
  { id: 'secondary-color', field: 'secondary_color', label: 'Secondary Color', placeholder: '#f89fb5' },
  { id: 'text-color', field: 'text_color', label: 'Text Color', placeholder: '#000000' },
  { id: 'background-color', field: 'background_color', label: 'Background Color', placeholder: '#ffffff' },
];

const SiteSettings = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    primary_color: '#fab3c2', secondary_color: '#f89fb5',
    text_color: '#000000', background_color: '#ffffff'
  });
  const [message, setMessage] = useState('');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/site-settings/');
      setSettings(response.data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setMessage('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = await getIdToken();
      await api.put('/admin/site-settings/', settings, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Settings saved successfully!');
      const root = document.documentElement;
      root.style.setProperty('--primary-color', settings.primary_color);
      root.style.setProperty('--secondary-color', settings.secondary_color);
      root.style.setProperty('--text-color', settings.text_color);
      root.style.setProperty('--background-color', settings.background_color);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); router.push('/admin/login'); }
    catch (err) { console.error('Error logging out:', err); }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-[1.2rem] text-[#666]">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="bg-brand-gradient text-white py-5 px-10 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.1)] md:flex-col md:gap-[15px] md:text-center">
        <div className="flex items-center gap-5 md:flex-col md:w-full">
          <button className={headerBtnClass} onClick={() => router.push('/admin/dashboard')}>← Back to Dashboard</button>
          <h1 className="m-0 text-[1.8rem]">Site Settings</h1>
        </div>
        <div className="flex items-center gap-5 md:flex-wrap md:justify-center md:w-full">
          <Link href="/" className={headerBtnClass}>Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className={headerBtnClass}>Logout</button>
        </div>
      </header>

      <div className="p-10 md:p-5 max-w-[1200px] mx-auto grid grid-cols-[2fr_1fr] lg:grid-cols-1 gap-[30px]">
        <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <h2 className="m-0 mb-[10px] text-[#333]">Color Settings</h2>
          <p className="text-[#666] mb-[30px] text-[0.95rem]">
            Customize the color scheme of your website. Changes will be applied immediately.
          </p>

          <div className="flex flex-col gap-[25px]">
            {COLOR_FIELDS.map(({ id, field, label, placeholder }) => (
              <div key={field} className="flex flex-col gap-[10px]">
                <label htmlFor={id} className="flex items-center gap-[10px] font-semibold text-[#333]">
                  {label}
                  <span className="w-[30px] h-[30px] rounded-[5px] border-2 border-[#ddd] inline-block" style={{ backgroundColor: settings[field] }} />
                </label>
                <div className="flex gap-[10px] items-center md:flex-col md:items-stretch">
                  <input
                    type="color"
                    id={id}
                    value={settings[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="w-[60px] h-[40px] border-2 border-[#ddd] rounded-[5px] cursor-pointer md:w-full"
                  />
                  <input
                    type="text"
                    value={settings[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="flex-1 p-[10px] border-2 border-[#ddd] rounded-[5px] font-mono text-[0.95rem] outline-none focus:border-brand"
                    placeholder={placeholder}
                  />
                </div>
              </div>
            ))}
          </div>

          {message && (
            <div className={`py-3 px-5 rounded-[5px] mt-5 font-medium border ${message.includes('Error') ? 'bg-[#ffe6e6] text-[#c53030] border-[#c53030]' : 'bg-[#e6f7e6] text-[#2d7d2d] border-[#2d7d2d]'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-[15px] mt-[30px] md:flex-col">
            <button
              onClick={handleSave}
              disabled={saving}
              className="py-3 px-6 rounded-[5px] border-none cursor-pointer text-base font-semibold transition-all duration-300 bg-brand text-white hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={loadSettings}
              disabled={saving}
              className="py-3 px-6 rounded-[5px] cursor-pointer text-base font-semibold transition-all duration-300 bg-[#f0f0f0] text-[#333] border-2 border-[#ddd] hover:bg-[#e0e0e0] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="bg-white p-[30px] rounded-[10px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] h-fit sticky top-5 lg:static">
          <h3 className="m-0 mb-5 text-[#333]">Preview</h3>
          <div
            className="rounded-[8px] overflow-hidden"
            style={{ backgroundColor: settings.background_color, color: settings.text_color, border: `2px solid ${settings.primary_color}` }}
          >
            <div className="py-[15px] px-5 font-semibold" style={{ backgroundColor: settings.primary_color, color: 'white' }}>
              Preview Header
            </div>
            <div className="p-5 flex flex-col gap-[15px]">
              <p className="m-0 leading-relaxed">This is how your colors will look on the website.</p>
              <button className="py-[10px] px-5 rounded-[5px] border-2 cursor-default font-medium text-center" style={{ backgroundColor: settings.primary_color, color: 'white', borderColor: settings.primary_color }}>
                Primary Button
              </button>
              <button className="py-[10px] px-5 rounded-[5px] border-2 cursor-default font-medium text-center bg-transparent" style={{ borderColor: settings.primary_color, color: settings.primary_color }}>
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
