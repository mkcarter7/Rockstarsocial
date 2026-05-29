'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../api/api';
import './SiteSettings.css';

const SiteSettings = () => {
  const { currentUser, logout, getIdToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    primary_color: '#fab3c2',
    secondary_color: '#f89fb5',
    text_color: '#000000',
    background_color: '#ffffff'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

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
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = await getIdToken();
      await api.put('/admin/site-settings/', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings saved successfully!');
      
      // Update CSS variables immediately
      updateCSSVariables(settings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateCSSVariables = (newSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', newSettings.primary_color);
    root.style.setProperty('--secondary-color', newSettings.secondary_color);
    root.style.setProperty('--text-color', newSettings.text_color);
    root.style.setProperty('--background-color', newSettings.background_color);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  if (loading) {
    return <div className="settings-loading">Loading...</div>;
  }

  return (
    <div className="admin-settings">
      <header className="settings-header">
        <div className="settings-header-left">
          <button 
            className="btn-back"
            onClick={() => router.push('/admin/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1>Site Settings</h1>
        </div>
        <div className="settings-header-right">
          <Link href="/" className="btn-home">Home</Link>
          <span>Welcome, {currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="settings-content">
        <div className="settings-section">
          <h2>Color Settings</h2>
          <p className="settings-description">
            Customize the color scheme of your website. Changes will be applied immediately.
          </p>

          <div className="color-inputs">
            <div className="color-input-group">
              <label htmlFor="primary-color">
                Primary Color
                <span className="color-preview" style={{ backgroundColor: settings.primary_color }}></span>
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="primary-color"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="color-text"
                  placeholder="#fab3c2"
                />
              </div>
            </div>

            <div className="color-input-group">
              <label htmlFor="secondary-color">
                Secondary Color
                <span className="color-preview" style={{ backgroundColor: settings.secondary_color }}></span>
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="secondary-color"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="color-text"
                  placeholder="#f89fb5"
                />
              </div>
            </div>

            <div className="color-input-group">
              <label htmlFor="text-color">
                Text Color
                <span className="color-preview" style={{ backgroundColor: settings.text_color }}></span>
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="text-color"
                  value={settings.text_color}
                  onChange={(e) => handleChange('text_color', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={settings.text_color}
                  onChange={(e) => handleChange('text_color', e.target.value)}
                  className="color-text"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="color-input-group">
              <label htmlFor="background-color">
                Background Color
                <span className="color-preview" style={{ backgroundColor: settings.background_color }}></span>
              </label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  id="background-color"
                  value={settings.background_color}
                  onChange={(e) => handleChange('background_color', e.target.value)}
                  className="color-picker"
                />
                <input
                  type="text"
                  value={settings.background_color}
                  onChange={(e) => handleChange('background_color', e.target.value)}
                  className="color-text"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`settings-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="settings-actions">
            <button 
              onClick={handleSave} 
              className="btn-save"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={loadSettings} 
              className="btn-reset"
              disabled={saving}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="settings-preview">
          <h3>Preview</h3>
          <div className="preview-box" style={{ 
            backgroundColor: settings.background_color,
            color: settings.text_color,
            border: `2px solid ${settings.primary_color}`
          }}>
            <div className="preview-header" style={{ backgroundColor: settings.primary_color, color: 'white' }}>
              Preview Header
            </div>
            <div className="preview-content">
              <p>This is how your colors will look on the website.</p>
              <button 
                className="preview-button"
                style={{ 
                  backgroundColor: settings.primary_color,
                  color: 'white'
                }}
              >
                Primary Button
              </button>
              <button 
                className="preview-button-secondary"
                style={{ 
                  borderColor: settings.primary_color,
                  color: settings.primary_color
                }}
              >
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
