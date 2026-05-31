'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-gradient p-5">
      <div className="bg-white py-[50px] px-10 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.2)] w-full max-w-[400px] text-center">
        <h1 className="text-[#333] mb-[10px] text-[2rem]">Admin Dashboard</h1>
        <h2 className="text-[#666] mb-[30px] text-[1.2rem] font-normal">Login</h2>
        {error && (
          <div className="bg-[#fee] text-[#c33] p-3 rounded-[5px] mb-5 text-center border border-[#fcc]">
            {error}
          </div>
        )}
        <div className="mt-[30px]">
          <p className="text-[#666] mb-[30px] leading-relaxed text-[0.95rem]">
            Sign in with your Google account to access the admin dashboard
          </p>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-[14px] px-5 bg-white text-[#333] border-2 border-[#ddd] rounded-lg text-base font-medium cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:border-[#4285F4] hover:bg-[#f8f9fa] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>Signing in...</>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
