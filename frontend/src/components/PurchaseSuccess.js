'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { checkPurchaseStatus } from '../api/api';

const statusBoxClass = "min-h-[60vh] flex items-center justify-center py-10 px-5";
const cardClass = "text-center py-10 px-10 bg-white rounded-[8px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]";
const actionBtnsClass = "flex gap-[15px] justify-center mt-[30px] flex-wrap md:flex-col";

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!sessionId) { setError('No session ID provided'); setLoading(false); return; }
      try {
        const response = await checkPurchaseStatus(sessionId);
        setPurchase(response.data);
      } catch (err) {
        console.error('Error checking purchase status:', err);
        setError('Failed to verify purchase. Please contact support.');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseStatus();
  }, [sessionId]);

  if (loading) {
    return (
      <div className={statusBoxClass}>
        <div className="max-w-[600px] w-full">
          <div className="text-center py-10 text-[1.1rem] text-[#666]">Verifying your purchase...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={statusBoxClass}>
        <div className="max-w-[600px] w-full">
          <div className={cardClass}>
            <h1 className="text-[#f44336] mb-[10px]">Error</h1>
            <p>{error}</p>
            <Link href="/themes" className="btn btn-primary mt-5">Back to Themes</Link>
          </div>
        </div>
      </div>
    );
  }

  if (purchase && purchase.status === 'completed') {
    return (
      <div className={statusBoxClass}>
        <div className="max-w-[600px] w-full">
          <div className={cardClass}>
            <div className="w-[80px] h-[80px] rounded-full bg-[#4caf50] text-white text-[48px] flex items-center justify-center mx-auto mb-5">✓</div>
            <h1 className="text-[#4caf50] mb-[10px]">Purchase Successful!</h1>
            <p>Thank you for purchasing <strong>{purchase.theme_name}</strong>!</p>
            {purchase.download_file ? (
              <div className="my-[30px] py-5 px-5 bg-[#f5f5f5] rounded-[4px]">
                <a href={purchase.download_file} download className="btn btn-primary py-[15px] px-[30px] text-[1.1rem] mb-[15px] inline-block">
                  Download Theme
                </a>
                <p className="text-[#666] text-[14px] mt-[10px]">If the download doesn't start automatically, click the button above.</p>
              </div>
            ) : (
              <div className="my-[30px] py-5 px-5 bg-[#f5f5f5] rounded-[4px]">
                <p className="text-[#666] text-[14px]">Your download link will be sent to your email shortly.</p>
              </div>
            )}
            <div className={actionBtnsClass}>
              <Link href="/themes" className="btn btn-secondary md:w-full">Browse More Themes</Link>
              <Link href="/" className="btn btn-secondary md:w-full">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={statusBoxClass}>
      <div className="max-w-[600px] w-full">
        <div className={cardClass}>
          <h1 className="text-[#ff9800] mb-[10px]">Processing Payment</h1>
          <p>Your payment is being processed. Please wait...</p>
          <Link href="/themes" className="btn btn-secondary mt-5">Back to Themes</Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
