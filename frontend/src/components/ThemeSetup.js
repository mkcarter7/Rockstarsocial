'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getThemeSetup, saveThemeSetup } from '../api/api';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function ThemeSetupInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slugError, setSlugError] = useState('');
  const [themeType, setThemeType] = useState('birthday');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please complete payment first.');
      setLoading(false);
      return;
    }

    const fetchWithRetry = async (retriesLeft = 5) => {
      try {
        const res = await getThemeSetup(sessionId);
        setOrder(res.data);
        setSlug(res.data.slug || '');
        setBusinessName(res.data.business_name || '');
        setThemeType(res.data.theme_type || 'birthday');
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 402 && retriesLeft > 0) {
          setTimeout(() => fetchWithRetry(retriesLeft - 1), 2000);
        } else {
          setError('Could not verify your purchase. Please contact support.');
          setLoading(false);
        }
      }
    };

    fetchWithRetry();
  }, [sessionId]);

  const handleSlugChange = (value) => {
    const formatted = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setSlug(formatted);
    if (formatted && !SLUG_REGEX.test(formatted)) {
      setSlugError('Use only lowercase letters, numbers, and hyphens (e.g. my-business)');
    } else {
      setSlugError('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!slug) { setSlugError('A custom path is required'); return; }
    if (!SLUG_REGEX.test(slug)) { setSlugError('Use only lowercase letters, numbers, and hyphens'); return; }

    setSaving(true);
    setError('');
    try {
      await saveThemeSetup({ session_id: sessionId, slug, business_name: businessName });
      setSaved(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save. Please try again.';
      setError(msg);
      setSaving(false);
    }
  };

  if (saved) {
    const setupUrl = `/${themeType}/setup?session_id=${sessionId}`;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-3">You're All Set!</h1>
          <p className="text-gray-600 mb-2">
            Your order for <strong>{order?.theme_name}</strong> has been confirmed.
          </p>
          <p className="text-gray-600 mb-8">
            Now let's set up your party — add your details, colours, and trivia below.
          </p>
          <a
            href={setupUrl}
            className="inline-block py-3 px-8 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors duration-200 mb-4"
          >
            Set Up My Party →
          </a>
          <br />
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Verifying your purchase...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <a href="/themes" className="inline-block py-3 px-6 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors duration-200">
            Back to Themes
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-black to-brand py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-5">
          <h1 className="text-4xl font-bold mb-2">🎉 Almost There!</h1>
          <p className="text-lg opacity-90">
            You purchased <strong>{order?.theme_name}</strong>. Set up your website below.
          </p>
        </div>
      </section>

      {/* Setup form */}
      <section className="py-16">
        <div className="max-w-xl mx-auto px-5">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* URL preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1 font-medium">Your website URL will be:</p>
              <p className="font-mono text-brand font-semibold text-lg break-all">
                1rockstarsocial.com/{themeType}/<span className="text-black">{slug || 'your-path'}</span>
              </p>
            </div>

            {/* Custom slug */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-black" htmlFor="slug">
                Custom Path <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500">
                This becomes the last part of your URL. Use lowercase letters, numbers, and hyphens only.
              </p>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="e.g. my-business"
                required
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              {slugError && <p className="text-red-500 text-sm">{slugError}</p>}
            </div>

            {/* Business name */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-black" htmlFor="businessName">
                Business / Site Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. My Awesome Business"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !!slugError}
              className="w-full py-4 bg-brand text-white rounded-lg font-semibold text-lg hover:bg-brand-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Launching...' : 'Launch My Website →'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

const ThemeSetup = () => (
  <Suspense fallback={
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">Loading...</p>
    </div>
  }>
    <ThemeSetupInner />
  </Suspense>
);

export default ThemeSetup;
