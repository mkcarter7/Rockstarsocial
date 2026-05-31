import React from 'react';
import Link from 'next/link';

const PurchaseCancel = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-10 px-5">
      <div className="max-w-[600px] w-full">
        <div className="text-center py-10 px-10 bg-white rounded-[8px] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
          <h1 className="text-[#666] mb-[10px]">Purchase Cancelled</h1>
          <p>Your purchase was cancelled. No charges were made.</p>
          <div className="flex gap-[15px] justify-center mt-[30px] flex-wrap md:flex-col">
            <Link href="/themes" className="btn btn-primary md:w-full">Browse Themes</Link>
            <Link href="/" className="btn btn-secondary md:w-full">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCancel;
