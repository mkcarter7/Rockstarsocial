'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerPhotos, getBabyShowerFAQ } from '../api/api';

// ─── Design tokens ──────────────────────────────────────────────────────────

const DEFAULT_TERRA = '#c17c5a';
const DEFAULT_BG = '#faf6f0';
const HERO_GRADIENT = 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)';

// ─── Baby size lookup (weeks 4–40) ──────────────────────────────────────────

const BABY_SIZES = {
  4: 'Poppy seed 🌱', 5: 'Sesame seed 🌾', 6: 'Sweet pea 🫛', 7: 'Blueberry 🫐',
  8: 'Raspberry 🍒', 9: 'Grape 🍇', 10: 'Kumquat 🍊', 11: 'Fig 🍑', 12: 'Lime 🍋',
  13: 'Lemon 🍋', 14: 'Peach 🍑', 15: 'Apple 🍎', 16: 'Avocado 🥑',
  17: 'Pear 🍐', 18: 'Bell pepper 🫑', 19: 'Tomato 🍅', 20: 'Banana 🍌',
  21: 'Carrot 🥕', 22: 'Papaya 🍈', 23: 'Mango 🥭', 24: 'Ear of corn 🌽',
  25: 'Cauliflower 🥦', 26: 'Scallions 🧅', 27: 'Head of lettuce 🥬',
  28: 'Eggplant 🍆', 29: 'Butternut squash 🎃', 30: 'Cabbage 🥬',
  31: 'Coconut 🥥', 32: 'Squash 🥒', 33: 'Pineapple 🍍', 34: 'Cantaloupe 🍈',
  35: 'Honeydew melon 🍈', 36: 'Head of romaine 🥬', 37: 'Winter melon 🍈',
  38: 'Leek 🌿', 39: 'Mini watermelon 🍉', 40: 'Watermelon 🍉',
};

// ─── Divider ─────────────────────────────────────────────────────────────────

const TerraDivider = ({ color = DEFAULT_TERRA }) => (
  <div className="flex items-center justify-center gap-4 my-6">
    <div className="h-px flex-1" style={{ background: `${color}40` }} />
    <span style={{ color, fontSize: '0.85rem' }}>🎀</span>
    <div className="h-px flex-1" style={{ background: `${color}40` }} />
  </div>
);

// ─── Section label ────────────────────────────────────────────────────────────

const SectionLabel = ({ children, color = DEFAULT_TERRA }) => (
  <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light text-center mb-1" style={{ color }}>
    {children}
  </p>
);

// ─── Pregnancy week badge ─────────────────────────────────────────────────────

const PregnancyBadge = ({ dueDate, color }) => {
  if (!dueDate) return null;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const [dy, dm, dd] = dueDate.split('-').map(Number);
  const dueDateObj = new Date(dy, dm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeksLeft = (dueDateObj - today) / msPerWeek;

  if (weeksLeft < 0) {
    return (
      <div className="flex justify-center my-6">
        <div
          className="w-[160px] h-[160px] rounded-full flex flex-col items-center justify-center text-center"
          style={{ border: `3px solid ${color}`, background: DEFAULT_BG, boxShadow: `0 4px 20px ${color}30` }}
        >
          <span className="text-[1.6rem] mb-1">🎉</span>
          <span className="text-[0.75rem] font-semibold uppercase tracking-wide" style={{ color }}>Baby has arrived!</span>
        </div>
      </div>
    );
  }

  const week = Math.max(1, Math.min(40, Math.round(40 - weeksLeft)));
  const size = BABY_SIZES[week] || 'Growing strong!';

  return (
    <div className="flex justify-center my-6">
      <div
        className="w-[180px] h-[180px] rounded-full flex flex-col items-center justify-center text-center px-4"
        style={{ border: `3px solid ${color}`, background: DEFAULT_BG, boxShadow: `0 4px 20px ${color}30` }}
      >
        <span className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Week</span>
        <span className="text-[3rem] font-light leading-none mb-1" style={{ color }}>{week}</span>
        <span className="text-[0.72rem] font-light leading-snug" style={{ color: '#7a5a46' }}>Baby is the size of a</span>
        <span className="text-[0.78rem] font-semibold leading-snug mt-[2px]" style={{ color }}>{size}</span>
      </div>
    </div>
  );
};

// ─── Live stream banner ───────────────────────────────────────────────────────

const LiveStreamBanner = ({ url, color }) => {
  if (!url) return null;
  return (
    <section className="py-4" style={{ background: color }}>
      <div className="container flex flex-col sm:flex-row items-center justify-center gap-4 text-white">
        <span className="text-[0.9rem] font-light tracking-wide">📺 Live Stream Available</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-6 font-semibold text-[0.85rem] uppercase tracking-[0.1em] hover:opacity-90 transition-opacity"
          style={{ background: 'white', color, borderRadius: '4px' }}
        >
          Watch Live
        </a>
      </div>
    </section>
  );
};

// ─── Countdown ────────────────────────────────────────────────────────────────

const ShowerCountdown = ({ showerDate, color }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const [y, m, d] = showerDate.split('-').map(Number);
      const diff = new Date(y, m - 1, d) - new Date();
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
  }, [showerDate]);

  if (!timeLeft) {
    return (
      <p className="text-[1.4rem] mt-5 font-light tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
        Today is the day! 🍼
      </p>
    );
  }

  const boxStyle = { border: `1px solid ${color}60`, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderRadius: '4px' };

  return (
    <div className="flex justify-center gap-4 flex-wrap mt-6">
      {['days', 'hours', 'minutes', 'seconds'].map(unit => (
        <div key={unit} className="py-[14px] px-5 min-w-[76px] text-center" style={boxStyle}>
          <span className="block text-[2rem] font-light" style={{ color }}>{timeLeft[unit]}</span>
          <span className="text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: '#9a7060' }}>{unit}</span>
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
  51: { label: 'Light drizzle', emoji: '🌦️' }, 61: { label: 'Light rain', emoji: '🌧️' },
  63: { label: 'Rain', emoji: '🌧️' }, 65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Light snow', emoji: '🌨️' }, 80: { label: 'Rain showers', emoji: '🌦️' },
  82: { label: 'Heavy showers', emoji: '⛈️' }, 95: { label: 'Thunderstorm', emoji: '⛈️' },
};
const toF = c => Math.round(c * 9 / 5 + 32);

const WeatherWidget = ({ eventDate, locationAddress, color }) => {
  const [weather, setWeather] = useState(null);
  const [wStatus, setWStatus] = useState('loading');

  useEffect(() => {
    if (!locationAddress) return;
    const [py, pm, pd] = eventDate.split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((new Date(py, pm - 1, pd) - today) / 86400000);
    if (diffDays > 16) { setWStatus('too-far'); return; }

    (async () => {
      try {
        const normalized = locationAddress.replace(/\s*\n\s*/g, ', ');

        const tryGeocode = async (q) => {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          return res.json();
        };

        let geoData = await tryGeocode(normalized);

        // Rural addresses often aren't in OSM by street number — fall back to
        // city/state (last two comma-separated parts) for a useful approximation.
        if (!geoData.length) {
          const parts = normalized.split(',').map(s => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            geoData = await tryGeocode(parts.slice(-2).join(', '));
          }
        }

        if (!geoData.length) { setWStatus('error'); return; }
        const { lat, lon } = geoData[0];
        const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${eventDate}&end_date=${eventDate}`);
        const wxData = await wxRes.json();
        const code = wxData.daily.weathercode[0];
        setWeather({ code, high: wxData.daily.temperature_2m_max[0], low: wxData.daily.temperature_2m_min[0], ...(WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️' }) });
        setWStatus('ok');
      } catch { setWStatus('error'); }
    })();
  }, [eventDate, locationAddress]);

  if (!locationAddress) return null;

  return (
    <div className="p-8 text-center bg-white" style={{ border: `1px solid ${color}40`, borderRadius: '4px', boxShadow: `0 2px 12px rgba(100,60,20,0.08)` }}>
      {wStatus === 'loading' && <p style={{ color: '#9a7060' }} className="font-light">Checking the forecast…</p>}
      {wStatus === 'too-far' && (
        <div>
          <p className="text-[1.5rem] mb-2">📅</p>
          <p className="font-semibold mb-1" style={{ color: '#3d1f0e' }}>Forecast coming soon</p>
          <p className="text-[0.85rem] font-light" style={{ color: '#9a7060' }}>Weather data becomes available within 16 days of the shower.</p>
        </div>
      )}
      {wStatus === 'error' && <p className="text-[0.9rem] font-light" style={{ color: '#9a7060' }}>Forecast unavailable for this location.</p>}
      {wStatus === 'ok' && weather && (
        <div>
          <div className="text-[4rem] mb-2 leading-none">{weather.emoji}</div>
          <p className="text-[1.1rem] font-light tracking-wide mb-4" style={{ color: '#3d1f0e' }}>{weather.label}</p>
          <div className="flex justify-center gap-10">
            <div className="text-center">
              <span className="block text-[2rem] font-light" style={{ color }}>{toF(weather.high)}°F</span>
              <span className="text-[0.7rem] uppercase tracking-wide font-light" style={{ color: '#9a7060' }}>{Math.round(weather.high)}°C · High</span>
            </div>
            <div className="text-center">
              <span className="block text-[2rem] font-light text-[#bbb]">{toF(weather.low)}°F</span>
              <span className="text-[0.7rem] uppercase tracking-wide font-light" style={{ color: '#9a7060' }}>{Math.round(weather.low)}°C · Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Photo carousel ───────────────────────────────────────────────────────────

const PhotoCarousel = ({ slug, color, secondaryColor }) => {
  const [photos, setPhotos] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    getBabyShowerPhotos(slug).then(res => setPhotos(res.data)).catch(() => {});
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
    <section className="pt-16 pb-12" style={{ background: secondaryColor }}>
      <div className="container">
        <SectionLabel color={color}>Photo Memories</SectionLabel>
        <TerraDivider color={color} />
        <div className="relative max-w-[700px] mx-auto">
          <div style={{ borderRadius: '4px', overflow: 'hidden', boxShadow: `0 4px 24px ${color}25`, background: '#f5f5f5' }}>
            <img
              key={idx}
              src={photo.image}
              alt={photo.caption || 'Baby shower photo'}
              className="w-full block object-contain max-h-[560px]"
            />
          </div>
          {(photo.caption || photo.uploaded_by_name) && (
            <div className="mt-3 text-center">
              {photo.caption && <p className="text-[0.95rem] italic font-light" style={{ color: '#5a3a2a' }}>"{photo.caption}"</p>}
              {photo.uploaded_by_name && <p className="text-[0.8rem] font-light mt-1" style={{ color: '#9a7060' }}>— {photo.uploaded_by_name}</p>}
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous photo"
                className="absolute top-1/2 -translate-y-1/2 left-1 md:left-[-18px] w-10 h-10 rounded-full bg-white flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform"
                style={{ border: `1px solid ${color}60`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color }}>‹</button>
              <button onClick={next} aria-label="Next photo"
                className="absolute top-1/2 -translate-y-1/2 right-1 md:right-[-18px] w-10 h-10 rounded-full bg-white flex items-center justify-center text-[1.1rem] hover:scale-105 transition-transform"
                style={{ border: `1px solid ${color}60`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', color }}>›</button>
              <div className="flex justify-center gap-2 mt-4">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => { setIdx(i); resetTimer(); }} aria-label={`Photo ${i + 1}`}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{ background: i === idx ? color : '#ddd' }} />
                ))}
              </div>
              <p className="text-center text-[0.8rem] font-light mt-2" style={{ color: '#bbb' }}>{idx + 1} / {photos.length}</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ section ──────────────────────────────────────────────────────────────

const FAQSection = ({ slug, color, secondaryColor }) => {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openIdx, setOpenIdx] = useState(null);

  useEffect(() => {
    getBabyShowerFAQ(slug).then(res => { setItems(res.data); setLoaded(true); }).catch(() => setLoaded(true));
  }, [slug]);

  if (!loaded || !items.length) return null;

  return (
    <section className="py-12" style={{ background: secondaryColor }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <SectionLabel color={color}>Frequently Asked</SectionLabel>
        <TerraDivider color={color} />
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={item.id} style={{ border: `1px solid ${color}30`, background: '#fff', borderRadius: '4px' }}>
              <button className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span className="font-light text-[0.95rem] pr-4" style={{ color: '#3d1f0e' }}>{item.question}</span>
                <span className="shrink-0 text-[1.2rem] font-light transition-transform" style={{ color, transform: openIdx === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openIdx === i && (
                <div className="px-6 pb-5">
                  <div className="h-px mb-4" style={{ background: `${color}20` }} />
                  <p className="font-light text-[0.9rem] leading-relaxed whitespace-pre-line" style={{ color: '#5a3a2a' }}>{item.answer}</p>
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
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (timeStr) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// ─── Main component ───────────────────────────────────────────────────────────

const notFoundClass = "text-center py-[80px] px-5";

const BabyShowerParty = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notActive, setNotActive] = useState(false);
  const [expired, setExpired] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    getBabyShower(slug)
      .then(res => { setParty(res.data); setLoading(false); })
      .catch(err => {
        const msg = err?.response?.data?.error || '';
        if (msg.includes('not yet active')) setNotActive(true);
        else if (msg.includes('expired')) setExpired(true);
        else setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    const hostToken = localStorage.getItem('hostToken');
    const hostSlug = localStorage.getItem('hostPartySlug');
    setIsHost(!!(hostToken && hostSlug === slug));
  }, [slug]);

  if (loading) return <div className={notFoundClass}><p className="font-light" style={{ color: '#7a5a46' }}>Loading...</p></div>;
  if (notActive) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d1f0e' }}>Almost Ready</h1>
      <p className="font-light" style={{ color: '#7a5a46' }}>This baby shower page is being set up. Check back in a moment.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: DEFAULT_TERRA, color: '#fff', borderRadius: '4px' }}>Go Home</Link>
    </div>
  );
  if (expired) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d1f0e' }}>This Page Has Closed</h1>
      <p className="font-light" style={{ color: '#7a5a46' }}>This baby shower page has expired and is no longer available.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: DEFAULT_TERRA, color: '#fff', borderRadius: '4px' }}>Go Home</Link>
    </div>
  );
  if (notFound) return (
    <div className={notFoundClass}>
      <h1 className="font-light" style={{ color: '#3d1f0e' }}>Page Not Found</h1>
      <p className="font-light" style={{ color: '#7a5a46' }}>This baby shower page doesn't exist or has expired.</p>
      <Link href="/" className="inline-block mt-4 py-3 px-8 uppercase tracking-[0.1em] text-[0.9rem] font-semibold hover:opacity-90" style={{ background: DEFAULT_TERRA, color: '#fff', borderRadius: '4px' }}>Go Home</Link>
    </div>
  );

  const color = party.theme_color || DEFAULT_TERRA;
  const secondaryColor = party.secondary_color || DEFAULT_BG;
  const hasBanner = !!party.banner_image;
  const showerDate = party.shower_date || party.party_date;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>

      {/* ── Hero (fully rectangular) ── */}
      <section className="relative text-center overflow-hidden">
        {hasBanner ? (
          <>
            <img src={party.banner_image} alt={party.parent_names || 'Baby shower'} className="w-full h-auto block" style={{ minHeight: 200 }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-5">
              {party.welcome_message && (
                <p className="text-[1.8rem] md:text-[3rem] lg:text-[4rem] font-light max-w-[620px] mx-auto mb-2 leading-snug tracking-[0.03em]"
                  style={{ color: 'white', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>{party.welcome_message}</p>
              )}
              {party.parent_names && (
                <p className="text-[0.75rem] md:text-[1.1rem] lg:text-[1.4rem] uppercase tracking-[0.3em] font-light mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{party.parent_names}</p>
              )}
            </div>
          </>
        ) : (
          <div className="py-[100px]" style={{ background: HERO_GRADIENT }}>
            <div className="container">
              {party.welcome_message && (
                <p className="text-[1.8rem] md:text-[2.2rem] font-light max-w-[620px] mx-auto mb-2 leading-snug tracking-[0.03em]"
                  style={{ color: '#3d1f0e' }}>{party.welcome_message}</p>
              )}
              {party.parent_names && (
                <p className="text-[0.75rem] uppercase tracking-[0.3em] font-light mt-2" style={{ color }}>{party.parent_names}</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Live stream banner ── */}
      <LiveStreamBanner url={party.livestream_url} color={color} />

      {/* ── Pregnancy week badge ── */}
      {party.due_date && (
        <section className="py-6" style={{ background: '#fff' }}>
          <div className="container" style={{ maxWidth: 620 }}>
            <SectionLabel color={color}>Baby's Growth</SectionLabel>
            <TerraDivider color={color} />
            <PregnancyBadge dueDate={party.due_date} color={color} />
          </div>
        </section>
      )}

      {/* ── Countdown ── */}
      <section className="py-10" style={{ background: party.due_date ? secondaryColor : '#fff' }}>
        <div className="container" style={{ maxWidth: 620 }}>
          <SectionLabel color={color}>Until the Shower</SectionLabel>
          <TerraDivider color={color} />
          <ShowerCountdown showerDate={showerDate} color={color} />
        </div>
      </section>

      {/* ── Event Details ── */}
      {(showerDate || party.party_time || party.location_name || party.location_address) && (
        <section className="py-12" style={{ background: party.due_date ? '#fff' : secondaryColor }}>
          <div className="container" style={{ maxWidth: 620 }}>
            <SectionLabel color={color}>The Details</SectionLabel>
            <TerraDivider color={color} />
            <div className="overflow-hidden bg-white" style={{ border: `1px solid ${color}40`, borderRadius: '4px' }}>
              {[
                { label: 'Date', value: formatDate(showerDate), icon: '🎀' },
                { label: 'Time', value: formatTime(party.party_time), icon: '🧸' },
                { label: 'Venue', value: party.location_name, icon: '🌸' },
                { label: 'Address', value: party.location_address, isAddress: true, icon: '🍼' },
              ]
                .filter(row => row.value)
                .map((row, i, arr) => (
                  <div key={row.label} className={`flex items-start gap-4 px-6 py-5 ${i < arr.length - 1 ? 'border-b' : ''}`} style={{ borderColor: `${color}20` }}>
                    <div className="mt-1 w-4 text-center shrink-0" style={{ color }}>{row.icon}</div>
                    <div className="flex-1">
                      <p className="text-[0.65rem] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color }}>{row.label}</p>
                      <p className="font-light text-[0.95rem] whitespace-pre-line" style={{ color: '#3d1f0e' }}>{row.value}</p>
                      {row.isAddress && (
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(row.value)}`}
                          target="_blank" rel="noreferrer"
                          className="inline-block mt-2 text-[0.78rem] uppercase tracking-[0.12em] font-light hover:opacity-70 transition-opacity"
                          style={{ color }}>
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
              { href: `/${slug}/story`, symbol: '🍼', label: 'Our Journey' },
              { href: `/${slug}/gifts`, symbol: '🎁', label: 'Registry' },
              { href: `/${slug}/trivia`, symbol: '🎯', label: 'Trivia' },
              { href: `/${slug}/names`, symbol: '💝', label: 'Name Ideas' },
            ].map(({ href, symbol, label }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-3 bg-white py-7 px-3 font-light transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px]"
                style={{ border: `1px solid ${color}50`, boxShadow: `0 2px 12px rgba(100,60,20,0.07)`, color: '#3d1f0e', borderRadius: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px rgba(193,124,90,0.18)`; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 12px rgba(100,60,20,0.07)`; }}
              >
                <span className="text-[1.4rem]">{symbol}</span>
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
            <SectionLabel color={color}>Shower Day Forecast</SectionLabel>
            <TerraDivider color={color} />
            <WeatherWidget eventDate={showerDate} locationAddress={party.location_address} color={color} />
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <FAQSection slug={slug} color={color} secondaryColor={secondaryColor} />

      {/* ── Photo carousel ── */}
      <PhotoCarousel slug={slug} color={color} secondaryColor={secondaryColor} />

      {/* ── Footer ── */}
      <div className="text-center py-8 text-[0.8rem] font-light tracking-wide" style={{ background: '#fff', color: '#b0906e' }}>
        <p>
          Created with{' '}
          <a href="/" style={{ color }} className="font-semibold no-underline">RockStar Social</a>
          &nbsp;·&nbsp; Active until {new Date(new Date(showerDate).getTime() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}
        </p>
      </div>

      {/* ── Manage button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href={isHost ? '/host/dashboard' : '/host/login'}
          className="flex items-center gap-2 font-light py-3 px-5 hover:opacity-90 transition-opacity text-[0.8rem] uppercase tracking-[0.1em]"
          style={{ background: color, color: '#fff', borderRadius: '4px', boxShadow: `0 4px 16px ${color}60` }}
        >
          ✦ {isHost ? 'Manage Baby Shower' : 'Host Login'}
        </Link>
      </div>
    </div>
  );
};

export default BabyShowerParty;
