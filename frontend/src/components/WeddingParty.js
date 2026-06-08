'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getWeddingParty, getWeddingPhotos, getWeddingSchedule, getWeddingFAQ } from '../api/api';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const DEFAULT_GOLD = '#c9a96e';
const DEFAULT_BG = '#fdfaf7';
const HERO_GRADIENT = 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)';

// ─── Divider ──────────────────────────────────────────────────────────────────

const GoldDivider = ({ color = DEFAULT_GOLD }) => (
  <div className="flex items-center justify-center gap-4 my-6">
    <div className="h-px flex-1" style={{ background: `${color}40` }} />
    <span style={{ color, fontSize: '0.85rem' }}>♡</span>
    <div className="h-px flex-1" style={{ background: `${color}40` }} />
  </div>
);

// ─── Section label ─────────────────────────────────────────────────────────────

const SectionLabel = ({ children, color = DEFAULT_GOLD }) => (
  <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light text-center mb-1" style={{ color }}>
    {children}
  </p>
);

// ─── Countdown ────────────────────────────────────────────────────────────────

const WeddingCountdown = ({ weddingDate, color, hasBanner }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const diff = new Date(weddingDate) - new Date();
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
  }, [weddingDate]);

  if (!timeLeft) {
    return (
      <p className="text-[1.4rem] mt-5 font-light tracking-[0.1em]" style={{ color: hasBanner ? 'white' : '#3d2c1e' }}>
        Today is the day ♡
      </p>
    );
  }

  const boxStyle = hasBanner
    ? { border: '1px solid rgba(201,169,110,0.7)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }
    : { border: '1px solid rgba(201,169,110,0.5)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' };

  const numStyle = hasBanner
    ? { color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }
    : { color: color || DEFAULT_GOLD };

  const labelStyle = hasBanner
    ? { color: 'rgba(255,255,255,0.85)' }
    : { color: '#8b6914' };

  return (
    <div className="flex justify-center gap-4 flex-wrap mt-6">
      {['days', 'hours', 'minutes', 'seconds'].map(unit => (
        <div key={unit} className="py-[14px] px-5 min-w-[76px] text-center" style={{ ...boxStyle, borderRadius: '30px 30px 4px 4px' }}>
          <span className="block text-[2rem] font-light" style={numStyle}>{timeLeft[unit]}</span>
          <span className="text-[0.65rem] uppercase tracking-[0.2em]" style={labelStyle}>{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Weather widget ───────────────────────────────────────────────────────────

const WMO_CODES = {
  0: { label: 'Clear sky', emoji: '☀️' }, 1: { label: 'Mainly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' }, 3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Foggy', emoji: '🌫️' }, 48: { label: 'Icy fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' }, 53: { label: 'Drizzle', emoji: '🌦️' },
  55: { label: 'Heavy drizzle', emoji: '🌦️' }, 61: { label: 'Light rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' }, 65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' }, 73: { label: 'Snow', emoji: '❄️' },
  75: { label: 'Heavy snow', emoji: '❄️' }, 77: { label: 'Snow grains', emoji: '🌨️' },
  80: { label: 'Rain showers', emoji: '🌦️' }, 81: { label: 'Rain showers', emoji: '🌦️' },
  82: { label: 'Heavy showers', emoji: '⛈️' }, 85: { label: 'Snow showers', emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '🌨️' }, 95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm', emoji: '⛈️' }, 99: { label: 'Thunderstorm', emoji: '⛈️' },
};

const toF = c => Math.round(c * 9 / 5 + 32);

const WeddingWeatherWidget = ({ weddingDate, locationAddress, color, secondaryColor }) => {
  const [weather, setWeather] = useState(null);
  const [wStatus, setWStatus] = useState('loading');

  useEffect(() => {
    if (!locationAddress) return;
    const [py, pm, pd] = weddingDate.split('-').map(Number);
    const partyLocal = new Date(py, pm - 1, pd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((partyLocal - today) / 86400000);
    if (diffDays > 16) { setWStatus('too-far'); return; }

    (async () => {
      try {
        const normalizedAddress = locationAddress.replace(/\s*\n\s*/g, ', ');
        const tryGeocode = async (q) => {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          return res.json();
        };
        let geoData = await tryGeocode(normalizedAddress);
        if (!geoData.length) {
          const parts = normalizedAddress.split(',').map(s => s.trim()).filter(Boolean);
          if (parts.length >= 2) geoData = await tryGeocode(parts.slice(-2).join(', '));
        }
        if (!geoData.length) { setWStatus('error'); return; }
        const { lat, lon } = geoData[0];
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${weddingDate}&end_date=${weddingDate}`
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
  }, [weddingDate, locationAddress]);

  if (!locationAddress) return null;

  return (
    <div
      className="p-8 text-center"
      style={{ border: `1px solid ${color}40`, background: '#fff', borderRadius: '40px 40px 4px 4px' }}
    >
      {wStatus === 'loading' && <p style={{ color: '#9a8070' }} className="font-light">Checking the forecast…</p>}
      {wStatus === 'too-far' && (
        <div>
          <p className="text-[1.5rem] mb-2">📅</p>
          <p className="font-semibold mb-1" style={{ color: '#5a3e2b' }}>Forecast coming soon</p>
          <p className="text-[0.85rem] font-light" style={{ color: '#9a8070' }}>Weather data becomes available within 16 days of the wedding.</p>
        </div>
      )}
      {wStatus === 'error' && <p className="text-[0.9rem] font-light" style={{ color: '#9a8070' }}>Forecast unavailable for this location.</p>}
      {wStatus === 'ok' && weather && (
        <div>
          <div className="text-[4rem] mb-2 leading-none">{weather.emoji}</div>
          <p className="text-[1.1rem] font-light tracking-wide mb-4" style={{ color: '#3d2c1e' }}>{weather.label}</p>
          <div className="flex justify-center gap-10">
            <div className="text-center">
              <span className="block text-[2rem] font-light" style={{ color }}>{toF(weather.high)}°F</span>
              <span className="text-[0.7rem] uppercase tracking-wide font-light" style={{ color: '#9a8070' }}>{Math.round(weather.high)}°C · High</span>
            </div>
            <div className="text-center">
              <span className="block text-[2rem] font-light text-[#bbb]">{toF(weather.low)}°F</span>
              <span className="text-[0.7rem] uppercase tracking-wide font-light" style={{ color: '#9a8070' }}>{Math.round(weather.low)}°C · Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Photo carousel ───────────────────────────────────────────────────────────

const WeddingPhotoCarousel = ({ slug, color, secondaryColor }) => {
  const [photos, setPhotos] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getWeddingPhotos(slug).then(res => setPhotos(res.data)).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (photos.length <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % photos.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [photos.length]);

  if (!photos.length) return null;

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % photos.length), 4000);
  };

  const prev = () => { setIdx(i => (i - 1 + photos.length) % photos.length); resetTimer(); };
  const next = () => { setIdx(i => (i + 1) % photos.length); resetTimer(); };
  const photo = photos[idx];

  return (
    <section
      className="pt-16 pb-12"
      style={{
        background: secondaryColor,
        borderRadius: '80px 80px 0 0',
        marginTop: -40,
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div className="container">
        <SectionLabel color={color}>Photo Memories</SectionLabel>
        <GoldDivider color={color} />
        <div className="relative max-w-[700px] mx-auto">
          <img
            key={idx}
            src={photo.image}
            alt={photo.caption || 'Wedding photo'}
            className="w-full object-cover"
            style={{
              height: 420,
              borderRadius: '120px 120px 8px 8px',
              boxShadow: '0 4px 24px rgba(201,169,110,0.15)',
            }}
          />
          {(photo.caption || photo.uploaded_by_name) && (
            <div className="mt-3 text-center">
              {photo.caption && <p className="text-[0.95rem] italic font-light" style={{ color: '#5a3e2b' }}>"{photo.caption}"</p>}
              {photo.uploaded_by_name && <p className="text-[0.8rem] font-light mt-1" style={{ color: '#9a8070' }}>— {photo.uploaded_by_name}</p>}
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous photo"
                className="absolute top-1/2 -translate-y-1/2 left-1 md:left-[-18px] w-10 h-10 rounded-full bg-white flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform"
                style={{ border: `1px solid ${color}60`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color }}>
                ‹
              </button>
              <button onClick={next} aria-label="Next photo"
                className="absolute top-1/2 -translate-y-1/2 right-1 md:right-[-18px] w-10 h-10 rounded-full bg-white flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform"
                style={{ border: `1px solid ${color}60`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color }}>
                ›
              </button>
              <div className="flex justify-center gap-2 mt-4">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => { setIdx(i); resetTimer(); }} aria-label={`Go to photo ${i + 1}`}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: i === idx ? color : '#ddd' }} />
                ))}
              </div>
              <p className="text-center text-[0.8rem] font-light mt-2" style={{ color: '#bbb' }}>
                {idx + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

const WeddingScheduleSection = ({ slug, color, secondaryColor }) => {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getWeddingSchedule(slug).then(res => { setItems(res.data); setLoaded(true); }).catch(() => setLoaded(true));
  }, [slug]);

  if (!loaded || !items.length) return null;

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (ds) => {
    if (!ds) return null;
    const [y, mo, d] = ds.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <section className="py-12" style={{ background: '#fff' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <SectionLabel color={color}>The Schedule</SectionLabel>
        <GoldDivider color={color} />
        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="p-6"
              style={{ border: `1px solid ${color}30`, background: secondaryColor, borderRadius: '40px 40px 4px 4px' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-semibold mt-1"
                  style={{ background: `${color}20`, color }}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[1rem] mb-1" style={{ color: '#3d2c1e' }}>{item.name}</p>
                  {(item.event_date || item.event_time) && (
                    <p className="text-[0.85rem] font-light mb-1" style={{ color }}>
                      {formatDate(item.event_date)}{item.event_date && item.event_time ? ' · ' : ''}{formatTime(item.event_time)}
                    </p>
                  )}
                  {item.location_name && (
                    <p className="text-[0.85rem] font-light" style={{ color: '#7a6050' }}>{item.location_name}</p>
                  )}
                  {item.description && (
                    <p className="text-[0.875rem] font-light mt-2 leading-relaxed" style={{ color: '#5a3e2b' }}>{item.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const WeddingFAQSection = ({ slug, color, secondaryColor }) => {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    getWeddingFAQ(slug).then(res => { setItems(res.data); setLoaded(true); }).catch(() => setLoaded(true));
  }, [slug]);

  if (!loaded || !items.length) return null;

  return (
    <section className="py-12" style={{ background: secondaryColor }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <SectionLabel color={color}>Frequently Asked</SectionLabel>
        <GoldDivider color={color} />
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={item.id} style={{ border: `1px solid ${color}30`, background: '#fff', borderRadius: 4 }}>
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-light text-[0.95rem] pr-4" style={{ color: '#3d2c1e' }}>{item.question}</span>
                <span className="shrink-0 text-[1.2rem] font-light transition-transform" style={{ color, transform: openIdx === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5">
                  <div className="h-px mb-4" style={{ background: `${color}20` }} />
                  <p className="font-light text-[0.9rem] leading-relaxed whitespace-pre-line" style={{ color: '#5a3e2b' }}>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
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

const WeddingParty = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notActive, setNotActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    getWeddingParty(slug)
      .then(res => { setParty(res.data); setLoading(false); })
      .catch(err => {
        const msg = err?.response?.data?.error || '';
        if (msg === 'This wedding is not yet active') setNotActive(true);
        else if (msg === 'This wedding has expired') setExpired(true);
        else setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const hostToken = localStorage.getItem('hostToken');
    const hostSlug = localStorage.getItem('hostPartySlug');
    setIsHost(!!(hostToken && hostSlug === slug));
  }, [slug]);

  if (loading) return <div className={notFoundClass}><p className="font-light" style={{ color: '#7a6050' }}>Loading...</p></div>;
  if (notActive) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d2c1e' }}>Almost Ready</h1>
      <p className="font-light" style={{ color: '#7a6050' }}>This wedding page is being set up. Check back in a moment or finish your setup.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: '#c9a96e', color: '#fff' }}>Go Home</Link>
    </div>
  );
  if (expired) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d2c1e' }}>This Page Has Closed</h1>
      <p className="font-light" style={{ color: '#7a6050' }}>This wedding page has expired and is no longer available.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: '#c9a96e', color: '#fff' }}>Go Home</Link>
    </div>
  );
  if (notFound) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d2c1e' }}>Page Not Found</h1>
      <p className="font-light" style={{ color: '#7a6050' }}>This wedding page doesn't exist or has expired.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: '#c9a96e', color: '#fff' }}>Go Home</Link>
    </div>
  );

  const color = party.theme_color || DEFAULT_GOLD;
  const secondaryColor = party.secondary_color || DEFAULT_BG;
  const hasBanner = !!party.banner_image;

  const heroStyle = hasBanner
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: HERO_GRADIENT };

  const heroTextColor = hasBanner ? 'white' : '#3d2c1e';

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>

      {/* ── Hero ── */}
      <section
        className="relative text-center overflow-hidden"
        style={{ borderRadius: '80px', marginTop: 16 }}
      >
        {hasBanner ? (
          <>
            <img
              src={party.banner_image}
              alt={party.couple_name || 'Wedding banner'}
              className="w-full h-auto block"
              style={{ minHeight: 200 }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
              {party.welcome_message && (
                <p className="text-[1.8rem] md:text-[2.2rem] font-light max-w-[620px] mx-auto mb-2 leading-snug tracking-[0.03em]"
                  style={{ color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                  {party.welcome_message}
                </p>
              )}
              {party.couple_name && (
                <p className="text-[0.75rem] uppercase tracking-[0.3em] font-light mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {party.couple_name}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="py-[100px]" style={{ background: HERO_GRADIENT }}>
            <div className="container">
              {party.welcome_message && (
                <p className="text-[1.8rem] md:text-[2.2rem] font-light max-w-[620px] mx-auto mb-2 leading-snug tracking-[0.03em]"
                  style={{ color: '#3d2c1e' }}>
                  {party.welcome_message}
                </p>
              )}
              {party.couple_name && (
                <p className="text-[0.75rem] uppercase tracking-[0.3em] font-light mt-2" style={{ color: '#c9a96e' }}>
                  {party.couple_name}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Countdown ── */}
      <section className="py-10" style={{ background: '#fff' }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <SectionLabel color={color}>Until We Say I Do</SectionLabel>
          <GoldDivider color={color} />
          <WeddingCountdown weddingDate={party.wedding_date || party.party_date} color={color} hasBanner={false} />
        </div>
      </section>

      {/* ── Event Details ── */}
      {(party.party_date || party.wedding_date || party.party_time || party.location_name || party.location_address) && (
        <section className="py-12" style={{ background: secondaryColor }}>
          <div className="container" style={{ maxWidth: 620 }}>
            <SectionLabel color={color}>The Details</SectionLabel>
            <GoldDivider color={color} />
            <div className="overflow-hidden bg-white" style={{ border: `1px solid ${color}40`, borderRadius: '40px 40px 4px 4px' }}>
              {[
                { label: 'Date', value: formatDate(party.wedding_date || party.party_date) },
                { label: 'Time', value: formatTime(party.party_time) },
                { label: 'Venue', value: party.location_name },
                { label: 'Address', value: party.location_address, isAddress: true },
              ]
                .filter(row => row.value)
                .map((row, i, arr) => (
                  <div key={row.label} className={`flex items-start gap-4 px-6 py-5 ${i < arr.length - 1 ? 'border-b' : ''}`} style={{ borderColor: `${color}20` }}>
                    <div className="mt-1 w-4 text-center shrink-0" style={{ color }}>♡</div>
                    <div className="flex-1">
                      <p className="text-[0.65rem] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color }}>{row.label}</p>
                      <p className="font-light text-[0.95rem] whitespace-pre-line" style={{ color: '#3d2c1e' }}>{row.value}</p>
                      {row.isAddress && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(row.value)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-2 text-[0.78rem] uppercase tracking-[0.12em] font-light hover:opacity-70 transition-opacity"
                          style={{ color }}
                        >
                          View on Map →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </section>
      )}

      {/* ── Nav links ── */}
      <section className="py-12" style={{ background: '#fff' }}>
        <div className="container">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4">
            {[
              { href: `/${slug}/photos`, symbol: '📷', label: 'Photos' },
              { href: `/${slug}/guestbook`, symbol: '♡', label: 'Guest Book' },
              { href: `/${slug}/rsvp`, symbol: '✉', label: 'RSVP' },
              { href: `/${slug}/story`, symbol: '∞', label: 'Our Story' },
              { href: `/${slug}/gifts`, symbol: '◇', label: 'Registry' },
              { href: `/${slug}/party`, symbol: '♛', label: 'Wedding Party' },
              { href: `/${slug}/songs`, symbol: '♪', label: 'Song Requests' },
            ].map(({ href, symbol, label }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-3 bg-white py-7 px-3 font-light transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px]"
                style={{ border: `1px solid ${color}50`, boxShadow: '0 2px 12px rgba(201,169,110,0.07)', color: '#3d2c1e', borderRadius: '40px 40px 4px 4px' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,169,110,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(201,169,110,0.07)'; }}
              >
                <span className="text-[1.4rem]" style={{ color }}>{symbol}</span>
                <span className="text-[0.75rem] uppercase tracking-[0.12em] text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Weather ── */}
      {party.location_address && (
        <section className="py-10" style={{ background: secondaryColor }}>
          <div className="container" style={{ maxWidth: 620 }}>
            <SectionLabel color={color}>Wedding Day Forecast</SectionLabel>
            <GoldDivider color={color} />
            <WeddingWeatherWidget
              weddingDate={party.wedding_date || party.party_date}
              locationAddress={party.location_address}
              color={color}
              secondaryColor={secondaryColor}
            />
          </div>
        </section>
      )}

      {/* ── Schedule ── */}
      <WeddingScheduleSection slug={slug} color={color} secondaryColor={secondaryColor} />

      {/* ── FAQ ── */}
      <WeddingFAQSection slug={slug} color={color} secondaryColor={secondaryColor} />

      {/* ── Photo carousel ── */}
      <WeddingPhotoCarousel slug={slug} color={color} secondaryColor={secondaryColor} />

      {/* ── Footer ── */}
      <div className="text-center py-8 text-[0.8rem] font-light tracking-wide" style={{ background: '#fff', color: '#b0a090' }}>
        <p>
          Created with{' '}
          <a href="/" style={{ color }} className="font-semibold no-underline">RockStar Social</a>
          &nbsp;·&nbsp; Active until {new Date(party.expires_at).toLocaleDateString()}
        </p>
      </div>

      {/* ── Manage Wedding button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href={isHost ? '/host/dashboard' : '/host/login'}
          className="flex items-center gap-2 font-light py-3 px-5 rounded-none hover:opacity-90 transition-opacity text-[0.8rem] uppercase tracking-[0.1em]"
          style={{ background: color, color: '#fff', boxShadow: '0 4px 16px rgba(201,169,110,0.4)' }}
        >
          ✦ {isHost ? 'Manage Wedding' : 'Host Login'}
        </Link>
      </div>
    </div>
  );
};

export default WeddingParty;
