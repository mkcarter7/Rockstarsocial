'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getThemes, createThemeCheckout } from '../api/api';

const Pricing = () => {
  const router = useRouter();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await getThemes();
        setThemes(response.data);
      } catch (err) {
        setError('Failed to load themes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, []);

  const handleThemePurchase = async (theme) => {
    if (theme.theme_type === 'birthday') {
      router.push(`/birthday/purchase?theme_id=${theme.id}`);
      return;
    }

    const customerEmail = prompt('Please enter your email address to get started:');
    if (!customerEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    try {
      const response = await createThemeCheckout({
        theme_id: theme.id,
        customer_email: customerEmail,
      });
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-black to-brand py-20 text-center text-white">
        <div className="max-w-5xl mx-auto px-5">
          <h1 className="text-5xl font-bold mb-4">Themes</h1>
          <p className="text-lg opacity-90">Choose the perfect theme to launch your website today</p>
        </div>
      </section>

      {/* Themes grid */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5">
          {loading ? (
            <p className="text-center text-gray-500 py-16 text-lg">Loading themes...</p>
          ) : error ? (
            <p className="text-center text-red-500 py-16">{error}</p>
          ) : themes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative bg-white rounded-2xl shadow-md p-8 text-center flex flex-col transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl ${
                    theme.popular ? 'border-2 border-brand scale-105' : ''
                  }`}
                >
                  {theme.popular && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white text-sm font-semibold px-5 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-2xl font-bold text-black mb-5">{theme.name}</h3>
                  <div className="mb-5">
                    <span className="text-2xl font-semibold text-brand align-top mt-2 inline-block">$</span>
                    <span className="text-6xl font-bold text-brand">{theme.price}</span>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">{theme.description}</p>
                  <ul className="text-left mb-8 space-y-3 flex-1 min-h-[200px]">
                    {theme.features && theme.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-700">
                        <span className="text-green-500 font-bold text-xl">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {theme.theme_type === 'birthday' ? (
                    <button
                      onClick={() => handleThemePurchase(theme)}
                      className="w-full py-4 bg-brand text-white rounded-lg font-semibold text-lg hover:bg-brand-dark hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                    >
                      Purchase
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-4 bg-gray-200 text-gray-400 rounded-lg font-semibold text-lg cursor-not-allowed"
                    >
                      🚧 Under Construction
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-16 text-lg">No themes available</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="text-4xl font-bold text-black mb-4">Need Something Custom?</h2>
          <p className="text-lg text-gray-600 mb-8">
            We can build a tailored website that fits your specific needs
          </p>
          <a href="/contact" className="inline-block py-3 px-8 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors duration-200">
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
