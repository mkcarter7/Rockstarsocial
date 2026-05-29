'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { checkPurchaseStatus } from '../api/api';
import './PurchaseSuccess.css';

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState(null);
  const [error, setError] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

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
      <div className="purchase-status">
        <div className="container">
          <div className="loading">Verifying your purchase...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-status">
        <div className="container">
          <div className="error-message">
            <h1>Error</h1>
            <p>{error}</p>
            <Link href="/themes" className="btn btn-primary">Back to Themes</Link>
          </div>
        </div>
      </div>
    );
  }

  if (purchase && purchase.status === 'completed') {
    return (
      <div className="purchase-status">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Purchase Successful!</h1>
            <p>Thank you for purchasing <strong>{purchase.theme_name}</strong>!</p>
            
            {purchase.download_file ? (
              <div className="download-section">
                <a 
                  href={purchase.download_file} 
                  download
                  className="btn btn-primary btn-large"
                >
                  Download Theme
                </a>
                <p className="download-note">
                  If the download doesn't start automatically, click the button above.
                </p>
              </div>
            ) : (
              <div className="download-section">
                <p className="download-note">
                  Your download link will be sent to your email shortly.
                </p>
              </div>
            )}
            
            <div className="action-buttons">
              <Link href="/themes" className="btn btn-secondary">Browse More Themes</Link>
              <Link href="/" className="btn btn-secondary">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase-status">
      <div className="container">
        <div className="pending-message">
          <h1>Processing Payment</h1>
          <p>Your payment is being processed. Please wait...</p>
          <Link href="/themes" className="btn btn-secondary">Back to Themes</Link>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
