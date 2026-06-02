'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayPhotos } from '../api/api';

// ─── Countdown ────────────────────────────────────────────────────────────────

const Countdown = ({ partyDate, themeColor }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(partyDate) - new Date();
      if (diff <= 0) return setTimeLeft(null);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [partyDate]);

  if (!timeLeft) return <p className="text-[1.5rem] mt-5">🎉 The celebration is here!</p>;

  return (
    <div className="flex justify-center gap-5 flex-wrap mt-5">
      {['days', 'hours', 'minutes', 'seconds'].map(unit => (
        <div key={unit} className="bg-[rgba(255,255,255,0.2)] border-2 rounded-[12px] py-[15px] px-5 min-w-[80px] text-center" style={{ borderColor: themeColor }}>
          <span className="block text-[2rem] font-bold text-white" style={{ color: themeColor }}>{timeLeft[unit]}</span>
          <span className="text-[0.75rem] uppercase tracking-[1px] text-[rgba(255,255,255,0.8)]">{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Weather widget ───────────────────────────────────────────────────────────

const WMO_CODES = {
  0: { label: 'Clear sky', emoji: '☀️' },
  1: { label: 'Mainly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' },
  48: { label: 'Icy fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌦️' },
  61: { label: 'Light rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' },
  73: { label: 'Snow', emoji: '❄️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  77: { label: 'Snow grains', emoji: '🌨️' },
  80: { label: 'Rain showers', emoji: '🌦️' },
  81: { label: 'Rain showers', emoji: '🌦️' },
  82: { label: 'Heavy showers', emoji: '⛈️' },
  85: { label: 'Snow showers', emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '🌨️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm', emoji: '⛈️' },
  99: { label: 'Thunderstorm', emoji: '⛈️' },
};

const toF = c => Math.round(c * 9 / 5 + 32);

const WeatherWidget = ({ partyDate, locationAddress, themeColor }) => {
  const [weather, setWeather] = useState(null);
  // 'loading' | 'ok' | 'too-far' | 'error'
  const [wStatus, setWStatus] = useState('loading');

  useEffect(() => {
    if (!locationAddress) return;

    // Compare party date to today as local calendar dates
    const [py, pm, pd] = partyDate.split('-').map(Number);
    const partyLocal = new Date(py, pm - 1, pd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((partyLocal - today) / 86400000);

    if (diffDays > 16) { setWStatus('too-far'); return; }

    (async () => {
      try {
        // Nominatim chokes on newlines (from the textarea), so normalize to a single line.
        const normalizedAddress = locationAddress.replace(/\s*\n\s*/g, ', ');

        const tryGeocode = async (q) => {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          return res.json();
        };

        let geoData = await tryGeocode(normalizedAddress);

        // Rural addresses often aren't in OSM by street number. Fall back to the
        // last two comma-separated chunks (e.g. "Bell Buckle, TN 37020") for a
        // city-level approximation that still gives a useful forecast.
        if (!geoData.length) {
          const parts = normalizedAddress.split(',').map(s => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            geoData = await tryGeocode(parts.slice(-2).join(', '));
          }
        }

        if (!geoData.length) { setWStatus('error'); return; }

        const { lat, lon } = geoData[0];
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${partyDate}&end_date=${partyDate}`
        );
        const wxData = await wxRes.json();
        const code = wxData.daily.weathercode[0];
        const high = wxData.daily.temperature_2m_max[0];
        const low = wxData.daily.temperature_2m_min[0];
        setWeather({ code, high, low, ...(WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️' }) });
        setWStatus('ok');
      } catch {
        setWStatus('error');
      }
    })();
  }, [partyDate, locationAddress]);

  if (!locationAddress) return null;

  return (
    <section className="py-10 bg-white">
      <div className="container" style={{ maxWidth: 620 }}>
        <h2 className="text-center text-[1.4rem] font-bold mb-5 text-[#333]">🌤️ Party Day Forecast</h2>
        <div className="rounded-[16px] border-2 p-8 text-center bg-[#fafcff]" style={{ borderColor: themeColor }}>
          {wStatus === 'loading' && <p className="text-[#888]">Checking the forecast…</p>}
          {wStatus === 'too-far' && (
            <div>
              <p className="text-[1.5rem] mb-2">📅</p>
              <p className="text-[#555] font-semibold mb-1">Forecast coming soon!</p>
              <p className="text-[0.85rem] text-[#888]">Weather data becomes available within 16 days of the event.</p>
            </div>
          )}
          {wStatus === 'error' && (
            <p className="text-[#888] text-[0.9rem]">Forecast unavailable for this location.</p>
          )}
          {wStatus === 'ok' && weather && (
            <div>
              <div className="text-[4rem] mb-2 leading-none">{weather.emoji}</div>
              <p className="text-[1.2rem] font-semibold text-[#333] mb-4">{weather.label}</p>
              <div className="flex justify-center gap-10">
                <div className="text-center">
                  <span className="block text-[2rem] font-bold" style={{ color: themeColor }}>{toF(weather.high)}°F</span>
                  <span className="text-[0.75rem] text-[#999] uppercase tracking-wide">{Math.round(weather.high)}°C · High</span>
                </div>
                <div className="text-center">
                  <span className="block text-[2rem] font-bold text-[#aaa]">{toF(weather.low)}°F</span>
                  <span className="text-[0.75rem] text-[#999] uppercase tracking-wide">{Math.round(weather.low)}°C · Low</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Photo carousel ───────────────────────────────────────────────────────────

const PhotoCarousel = ({ slug, themeColor }) => {
  const [photos, setPhotos] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    getBirthdayPhotos(slug)
      .then(res => setPhotos(res.data))
      .catch(() => {});
  }, [slug]);

  if (!photos.length) return null;

  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  const photo = photos[idx];

  return (
    <section className="py-12 bg-[#fafafa]">
      <div className="container">
        <h2 className="text-center text-[1.4rem] font-bold mb-6 text-[#333]">📸 Party Memories</h2>
        <div className="relative max-w-[700px] mx-auto">
          <img
            key={idx}
            src={photo.image}
            alt={photo.caption || 'Party photo'}
            className="w-full rounded-[14px] object-cover shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
            style={{ maxHeight: 500 }}
          />

          {(photo.caption || photo.uploaded_by_name) && (
            <div className="mt-3 text-center">
              {photo.caption && <p className="text-[#444] text-[0.95rem] italic">"{photo.caption}"</p>}
              {photo.uploaded_by_name && (
                <p className="text-[#888] text-[0.8rem] mt-1">— {photo.uploaded_by_name}</p>
              )}
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="absolute top-1/2 -translate-y-1/2 left-[-18px] w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform border-2"
                style={{ borderColor: themeColor }}
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="absolute top-1/2 -translate-y-1/2 right-[-18px] w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform border-2"
                style={{ borderColor: themeColor }}
              >
                ›
              </button>
              <div className="flex justify-center gap-2 mt-4">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    aria-label={`Go to photo ${i + 1}`}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: i === idx ? themeColor : '#ccc' }}
                  />
                ))}
              </div>
              <p className="text-center text-[0.8rem] text-[#aaa] mt-2">
                {idx + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// ─── Main component ───────────────────────────────────────────────────────────

const notFoundClass = "text-center py-[80px] px-5";

const BirthdayParty = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notActive, setNotActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    getBirthdayParty(slug)
      .then(res => { setParty(res.data); setLoading(false); })
      .catch(err => {
        const msg = err?.response?.data?.error || '';
        if (msg === 'This party is not yet active') setNotActive(true);
        else if (msg === 'This party has expired') setExpired(true);
        else setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const hostToken = localStorage.getItem('hostToken');
    const hostSlug = localStorage.getItem('hostPartySlug');
    setIsHost(!!(hostToken && hostSlug === slug));
  }, [slug]);

  if (loading) return <div className={notFoundClass}><p>Loading party...</p></div>;
  if (notActive) return (
    <div className={notFoundClass}>
      <h1>Almost Ready!</h1>
      <p>This birthday page is being set up. Check back in a moment or finish your setup.</p>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
  if (expired) return (
    <div className={notFoundClass}>
      <h1>This Party Has Ended</h1>
      <p>This birthday page has expired and is no longer available.</p>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
  if (notFound) return (
    <div className={notFoundClass}>
      <h1>Party Not Found</h1>
      <p>This birthday page doesn't exist or has expired.</p>
      <Link href="/" className="btn btn-primary">Go Home</Link>
    </div>
  );

  const color = party.theme_color || '#ff6b9d';

  // Hero background: full image if provided, otherwise gradient
  const heroStyle = party.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` };

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative text-white py-[80px] text-center overflow-hidden" style={heroStyle}>
        {party.banner_image && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
        )}
        <div className="container relative z-[1]">
          <h1 className="text-[2.5rem] mb-5 text-white">🎂 Happy Birthday, {party.birthday_person_name}!</h1>
          {party.welcome_message && (
            <p className="text-[1.2rem] max-w-[600px] mx-auto mb-[30px] opacity-95">{party.welcome_message}</p>
          )}
          <Countdown partyDate={party.party_date} themeColor={color} />
        </div>
      </section>

      {/* ── Nav links ── */}
      <section className="py-10 bg-[#fafafa]">
        <div className="container">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-5">
            {[
              { href: `/birthday/${slug}/photos`, icon: '📸', label: 'Photos' },
              { href: `/birthday/${slug}/guestbook`, icon: '📖', label: 'Guest Book' },
              { href: `/birthday/${slug}/rsvp`, icon: '✅', label: 'RSVP' },
              { href: `/birthday/${slug}/trivia`, icon: '🎯', label: 'Trivia' },
            ].map(({ href, icon, label }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-[10px] bg-white border-2 rounded-[12px] py-[25px] px-[15px] text-[#333] font-semibold transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_25px_rgba(0,0,0,0.12)]"
                style={{ borderColor: color }}
              >
                <span className="text-[2rem]">{icon}</span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Party Details ── */}
      {(party.party_date || party.party_time || party.location_name || party.location_address) && (
        <section className="py-10 bg-white">
          <div className="container" style={{ maxWidth: 620 }}>
            <h2 className="text-center text-[1.4rem] font-bold mb-5 text-[#333]">🎉 Event Details</h2>
            <div className="rounded-[16px] border-2 overflow-hidden" style={{ borderColor: color }}>
              {[
                { icon: '📅', label: 'Date', value: formatDate(party.party_date) },
                { icon: '🕐', label: 'Time', value: formatTime(party.party_time) },
                { icon: '🏛️', label: 'Venue', value: party.location_name },
                { icon: '📍', label: 'Address', value: party.location_address },
              ]
                .filter(row => row.value)
                .map((row, i, arr) => (
                  <div
                    key={row.label}
                    className={`flex items-start gap-4 px-6 py-4 ${i < arr.length - 1 ? 'border-b' : ''}`}
                    style={{ borderColor: `${color}33` }}
                  >
                    <span className="text-[1.5rem] mt-[2px]">{row.icon}</span>
                    <div>
                      <p className="text-[0.75rem] uppercase tracking-widest font-semibold mb-[2px]" style={{ color }}>{row.label}</p>
                      <p className="text-[#333] text-[0.95rem] whitespace-pre-line">{row.value}</p>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ── Weather widget ── */}
      <WeatherWidget partyDate={party.party_date} locationAddress={party.location_address} themeColor={color} />

      {/* ── Map ── */}
      {party.location_address && (
        <section className="bg-white pb-10">
          <div className="container" style={{ maxWidth: 800 }}>
            <h2 className="text-center text-[1.4rem] font-bold mb-5 text-[#333]">🗺️ Getting There</h2>
            <div className="rounded-[14px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-2" style={{ borderColor: color }}>
              <iframe
                title="Party venue map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(party.location_address)}&output=embed`}
                width="100%"
                height="380"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="text-center mt-4">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(party.location_address)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-semibold py-2 px-6 rounded-full text-white text-[0.9rem] hover:opacity-90 transition-opacity"
                style={{ background: color }}
              >
                Get Directions →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Photo carousel ── */}
      <PhotoCarousel slug={slug} themeColor={color} />

      {/* ── Footer ── */}
      <div className="text-center py-[30px] text-[#999] text-[0.85rem]">
        <p>
          Created with <a href="/" style={{ color }} className="font-semibold no-underline">RockStar Social</a>
          &nbsp;·&nbsp; Active until {new Date(party.expires_at).toLocaleDateString()}
        </p>
      </div>

      {/* ── Manage Party button (always visible) ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href={isHost ? '/host/dashboard' : '/host/login'}
          className="flex items-center gap-2 text-white font-semibold py-3 px-5 rounded-full shadow-lg hover:opacity-90 transition-opacity text-[0.9rem]"
          style={{ background: color }}
        >
          ⚙️ {isHost ? 'Manage Party' : 'Host Login'}
        </Link>
      </div>
    </div>
  );
};

export default BirthdayParty;
