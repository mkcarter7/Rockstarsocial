'use client';

import React, { useState } from 'react';
import { requestHostAccess } from '../api/api';

const HostLogin = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await requestHostAccess(email.trim().toLowerCase());
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or contact support.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section
        className="py-[80px] text-center text-white"
        style={{ background: 'linear-gradient(135deg, #ff6b9d 0%, #c850c0 100%)' }}
      >
        <div className="container">
          <h1 className="text-[2.2rem] text-white mb-3">🎂 Party Host Login</h1>
          <p className="text-[1.1rem] opacity-90">
            Enter the email you used to purchase your party page.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 480 }}>
          {submitted ? (
            <div className="bg-white rounded-[12px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.08)] text-center">
              <div className="text-[3rem] mb-4">📬</div>
              <h2 className="mb-3">Check your inbox!</h2>
              <p className="text-[#555]">
                If a party page exists for <strong>{email}</strong>, we sent a login link.
                It expires in 24 hours and can only be used once.
              </p>
              <button
                onClick={() => { setSubmitted(false); setEmail(''); }}
                className="mt-6 text-[#ff6b9d] font-semibold underline text-[0.9rem]"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-[12px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.08)]"
            >
              {error && (
                <div className="py-3 px-4 rounded-[6px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181] text-[0.9rem]">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2 mb-6">
                <label htmlFor="host-email" className="font-semibold text-black">
                  Your email address
                </label>
                <input
                  id="host-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="py-[10px] px-3 border border-[#ddd] rounded-[6px] text-[0.9rem] outline-none focus:border-[#ff6b9d] w-full"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-4 text-[1rem] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send me a login link'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default HostLogin;
