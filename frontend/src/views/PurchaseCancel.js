import React from 'react';
import Link from 'next/link';
import './PurchaseCancel.css';

const PurchaseCancel = () => {
  return (
    <div className="purchase-cancel">
      <div className="container">
        <div className="cancel-message">
          <h1>Purchase Cancelled</h1>
          <p>Your purchase was cancelled. No charges were made.</p>
          <div className="action-buttons">
            <Link href="/themes" className="btn btn-primary">Browse Themes</Link>
            <Link href="/" className="btn btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCancel;
