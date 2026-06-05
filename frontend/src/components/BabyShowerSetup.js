'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getBabyShowerSetup, saveBabyShowerSetup,
  getBabyShowerStory, addBabyShowerStoryEntry, deleteBabyShowerStoryEntry,
  getBabyShowerGifts, addBabyShowerGiftItem, deleteBabyShowerGiftItem,
  getBabyShowerFAQ, addBabyShowerFAQItem, deleteBabyShowerFAQItem,
  getBabyShowerTrivia, addBabyShowerTriviaQuestion,
} from '../api/api';

const TERRA = '#c17c5a';
const LINEN = '#faf6f0';

const inputClass = "py-[10px] px-3 border border-[#d9c8bc] rounded-[4px] text-[0.9rem] font-[inherit] outline-none focus:border-[#c17c5a] w-full";

const BabyShowerSetup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const sessionToken = searchParams.get('session_token');
  const isHostReturn = !!sessionToken;

  const [shower, setShower] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [themeColor, setThemeColor] = useState(TERRA);
  const [secondaryColor, setSecondaryColor] = useState(LINEN);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState(null);
  const [showerTime, setShowerTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [giftRegistryUrl, setGiftRegistryUrl] = useState('');
  const [venmoHandle, setVenmoHandle] = useState('');
  const [cashappHandle, setCashappHandle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [livestreamUrl, setLivestreamUrl] = useState('');

  const [storyEntries, setStoryEntries] = useState([]);
  const [storyForm, setStoryForm] = useState({ date_label: '', title: '', description: '' });
  const [addingEntry, setAddingEntry] = useState(false);
  const [storyError, setStoryError] = useState('');

  const [gifts, setGifts] = useState([]);
  const [giftForm, setGiftForm] = useState({ title: '', description: '', link_url: '', price: '' });
  const [addingGift, setAddingGift] = useState(false);
  const [giftError, setGiftError] = useState('');

  const [faqItems, setFaqItems] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [addingFaq, setAddingFaq] = useState(false);

  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [triviaForm, setTriviaForm] = useState({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', points: 10 });
  const [addingTrivia, setAddingTrivia] = useState(false);
  const [triviaError, setTriviaError] = useState('');

  useEffect(() => {
    if (!sessionId && !sessionToken) {
      setError('No session found. Please complete payment or log in first.');
      setLoading(false);
      return;
    }
    getBabyShowerSetup(sessionId, sessionToken)
      .then((res) => {
        setShower(res.data);
        setThemeColor(res.data.theme_color || TERRA);
        setSecondaryColor(res.data.secondary_color || LINEN);
        setWelcomeMessage(res.data.welcome_message || '');
        setShowerTime(res.data.party_time || '');
        setLocationName(res.data.location_name || '');
        setLocationAddress(res.data.location_address || '');
        setGiftRegistryUrl(res.data.gift_registry_url || '');
        setVenmoHandle(res.data.venmo_handle || '');
        setCashappHandle(res.data.cashapp_handle || '');
        setDueDate(res.data.due_date || '');
        setLivestreamUrl(res.data.livestream_url || '');
        if (res.data.banner_image) setExistingBannerUrl(res.data.banner_image);
        if (res.data.is_active) {
          const token = isHostReturn ? sessionToken : null;
          return Promise.all([
            getBabyShowerStory(res.data.slug),
            getBabyShowerGifts(res.data.slug, token),
            getBabyShowerFAQ(res.data.slug),
            getBabyShowerTrivia(res.data.slug),
          ]).then(([sRes, gRes, faqRes, trivRes]) => {
            setStoryEntries(sRes.data);
            setGifts(gRes.data);
            setFaqItems(faqRes.data);
            setTriviaQuestions(trivRes.data);
          });
        }
      })
      .catch(() => setError('Could not load your baby shower page. Please contact support.'))
      .finally(() => setLoading(false));
  }, [sessionId, sessionToken]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData();
    if (isHostReturn) formData.append('session_token', sessionToken);
    else formData.append('session_id', sessionId);
    formData.append('theme_color', themeColor);
    formData.append('secondary_color', secondaryColor);
    formData.append('welcome_message', welcomeMessage);
    if (bannerImage) formData.append('banner_image', bannerImage);
    formData.append('party_time', showerTime);
    formData.append('location_name', locationName);
    formData.append('location_address', locationAddress);
    formData.append('gift_registry_url', giftRegistryUrl);
    formData.append('venmo_handle', venmoHandle);
    formData.append('cashapp_handle', cashappHandle);
    formData.append('due_date', dueDate);
    formData.append('livestream_url', livestreamUrl);
    try {
      await saveBabyShowerSetup(formData);
      router.push(`/${shower.slug}`);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const handleAddStoryEntry = async (e) => {
    e.preventDefault();
    setStoryError('');
    setAddingEntry(true);
    try {
      const data = isHostReturn
        ? { ...storyForm, session_token: sessionToken }
        : { ...storyForm, session_id: sessionId };
      const res = await addBabyShowerStoryEntry(shower.slug, data);
      setStoryEntries(prev => [...prev, res.data]);
      setStoryForm({ date_label: '', title: '', description: '' });
    } catch (err) {
      setStoryError(err.response?.data?.error || 'Failed to add entry. Please try again.');
    }
    setAddingEntry(false);
  };

  const handleDeleteStoryEntry = async (entryId) => {
    try {
      await deleteBabyShowerStoryEntry(shower.slug, entryId, sessionToken);
      setStoryEntries(prev => prev.filter(e => e.id !== entryId));
    } catch {
      alert('Could not delete entry. Please try again.');
    }
  };

  const handleAddGift = async (e) => {
    e.preventDefault();
    setGiftError('');
    setAddingGift(true);
    try {
      const res = await addBabyShowerGiftItem(shower.slug, { ...giftForm, session_token: sessionToken });
      setGifts(prev => [...prev, res.data]);
      setGiftForm({ title: '', description: '', link_url: '', price: '' });
    } catch (err) {
      setGiftError(err.response?.data?.error || 'Failed to add gift. Please try again.');
    }
    setAddingGift(false);
  };

  const handleDeleteGift = async (giftId) => {
    try {
      await deleteBabyShowerGiftItem(shower.slug, giftId, sessionToken);
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch {
      alert('Could not delete gift. Please try again.');
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    setAddingFaq(true);
    try {
      const res = await addBabyShowerFAQItem(shower.slug, { ...faqForm, session_token: sessionToken });
      setFaqItems(prev => [...prev, res.data]);
      setFaqForm({ question: '', answer: '' });
    } catch { alert('Could not add FAQ. Please try again.'); }
    setAddingFaq(false);
  };

  const handleAddTrivia = async (e) => {
    e.preventDefault();
    setTriviaError('');
    setAddingTrivia(true);
    try {
      const data = isHostReturn
        ? { ...triviaForm, session_token: sessionToken }
        : { ...triviaForm, session_id: sessionId };
      const res = await addBabyShowerTriviaQuestion(shower.slug, data);
      setTriviaQuestions(prev => [...prev, { ...triviaForm, id: res.data.id }]);
      setTriviaForm({ question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', points: 10 });
    } catch (err) {
      setTriviaError(err.response?.data?.error || 'Failed to add question. Please try again.');
    }
    setAddingTrivia(false);
  };

  const card = {
    background: 'white',
    borderRadius: '4px',
    border: `1px solid rgba(193,124,90,0.2)`,
    boxShadow: '0 2px 20px rgba(100,60,20,0.08)',
    padding: '30px',
  };

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading your baby shower page...</div>;
  if (error && !shower) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}><p>{error}</p></div>;

  return (
    <div style={{ background: LINEN, minHeight: '100vh' }}>
      <section
        className="py-[80px] text-center relative overflow-hidden"
        style={
          bannerImagePreview || existingBannerUrl
            ? { backgroundImage: `url(${bannerImagePreview || existingBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' }
        }
      >
        {(bannerImagePreview || existingBannerUrl) && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        )}
        <div className="container relative z-[1]">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light mb-2"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? 'rgba(255,255,255,0.7)' : TERRA }}>
            Setup
          </p>
          <h1 className="text-[2rem] font-light tracking-[0.03em]"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? '#fff' : '#3d1f0e' }}>
            Almost there, {shower?.host_name}
          </h1>
          <p className="font-light mt-2"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            Personalize {shower?.parent_names || 'your'}'s baby shower page before it goes live.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: LINEN }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── Left: Main settings ── */}
          <div>
            <form onSubmit={handleSave} className="max-w-[600px] mx-auto bg-white p-5 md:p-10" style={{ borderRadius: '4px', border: `1px solid rgba(193,124,90,0.2)`, boxShadow: '0 2px 20px rgba(100,60,20,0.08)' }}>
              {error && (
                <div className="py-[15px] px-5 mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]" style={{ borderRadius: '4px' }}>{error}</div>
              )}

              <div className="p-5 mb-8 text-center" style={{ background: '#fdf3ed', border: `1px solid ${TERRA}`, borderRadius: '4px' }}>
                <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: TERRA }}>Your Page URL</p>
                <a href={`/${shower?.slug}`} target="_blank" rel="noreferrer"
                  className="inline-block text-base font-light break-all mb-1" style={{ color: TERRA }}>
                  1rockstarsocial.com/{shower?.slug}
                </a>
                <p className="text-[0.8rem] font-light m-0" style={{ color: '#9a7060' }}>Customize your page below, then click Save to make it live.</p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Hero Appearance</label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a7060' }}>Choose a color, or upload a photo — the photo takes priority if both are set.</p>
                <div className="flex gap-[10px] items-center">
                  <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-[60px] h-10 border border-[#d9c8bc] cursor-pointer" style={{ borderRadius: '4px' }} />
                  <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} placeholder="#c17c5a" className="flex-1 py-[10px] px-3 border border-[#d9c8bc] font-mono text-[0.95rem] outline-none focus:border-[#c17c5a]" style={{ borderRadius: '4px' }} />
                </div>
                {(existingBannerUrl || bannerImagePreview) && (
                  <div className="relative w-full h-[90px] overflow-hidden border border-[#d9c8bc]" style={{ borderRadius: '4px' }}>
                    <img src={bannerImagePreview || existingBannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-2 text-white text-[0.7rem] bg-[rgba(0,0,0,0.5)] px-2 py-[2px] rounded-full">
                      {bannerImagePreview ? 'New image' : 'Current image'}
                    </span>
                  </div>
                )}
                <label htmlFor="banner_image" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  {existingBannerUrl ? 'Replace banner image' : 'Add a banner image'}{' '}
                  <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <input type="file" id="banner_image" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (file) { setBannerImage(file); setBannerImagePreview(URL.createObjectURL(file)); }
                }} className="py-[5px]" />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Page Background Color</label>
                <div className="flex gap-[10px] items-center">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-[60px] h-10 border border-[#d9c8bc] cursor-pointer" style={{ borderRadius: '4px' }} />
                  <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} placeholder="#faf6f0" className="flex-1 py-[10px] px-3 border border-[#d9c8bc] font-mono text-[0.95rem] outline-none focus:border-[#c17c5a]" style={{ borderRadius: '4px' }} />
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="welcome_message" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Welcome Message</label>
                <textarea id="welcome_message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows="4"
                  placeholder={`Join us as we welcome baby ${shower?.parent_names || ''}!`}
                  className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="shower_time" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Shower Start Time <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <input type="time" id="shower_time" value={showerTime} onChange={e => setShowerTime(e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="due_date" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Baby's Due Date <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a7060' }}>
                  Used to show guests the current pregnancy week and baby's size. Updates automatically every day.
                </p>
                <input type="date" id="due_date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="livestream_url" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Live Stream URL <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a7060' }}>
                  Guests will see a "Watch Live" button on your page when this is set. Works with Facebook Live, YouTube, Twitch, and more.
                </p>
                <input type="url" id="livestream_url" value={livestreamUrl} onChange={e => setLivestreamUrl(e.target.value)}
                  placeholder="https://www.facebook.com/live/..." className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_name" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Venue Name <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <input type="text" id="location_name" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. The Garden Room" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_address" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Venue Address <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <textarea id="location_address" value={locationAddress} onChange={e => setLocationAddress(e.target.value)} rows="3"
                  placeholder="123 Bloom Lane, Austin, TX 78701" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="gift_registry_url" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                  Registry Link <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a7060' }}>Paste a link to your Babylist, Amazon Baby Registry, or any other registry.</p>
                <input type="url" id="gift_registry_url" value={giftRegistryUrl} onChange={e => setGiftRegistryUrl(e.target.value)} placeholder="https://www.babylist.com/..." className={inputClass} />

                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em] mt-2" style={{ color: '#3d1f0e' }}>
                  Venmo Handle <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <input type="text" value={venmoHandle} onChange={e => setVenmoHandle(e.target.value.replace(/^@/, ''))} placeholder="yourhandle" className={inputClass} />

                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em] mt-2" style={{ color: '#3d1f0e' }}>
                  Cash App Handle <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                </label>
                <input type="text" value={cashappHandle} onChange={e => setCashappHandle(e.target.value.replace(/^\$/, ''))} placeholder="yourcashtag" className={inputClass} />
              </div>

              <button type="submit"
                className="w-full py-4 px-10 text-[0.9rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: TERRA, color: '#fff', borderRadius: '4px' }}
                disabled={saving}>
                {saving ? 'Saving...' : isHostReturn ? 'Save Changes' : 'Save & Go to My Baby Shower Page'}
              </button>
            </form>
          </div>

          {/* ── Right: Story, Gifts, Trivia, FAQ ── */}
          <div className="flex flex-col gap-10">

            {/* Our Journey */}
            <div style={card}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: TERRA }}>Our Journey</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Journey Timeline</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a5a46' }}>
                Add milestones from the parents' journey — guests will see them on a beautiful vertical timeline.
              </p>
              {storyError && (
                <div className="py-[15px] px-5 mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]" style={{ borderRadius: '4px' }}>{storyError}</div>
              )}
              {storyEntries.length > 0 && (
                <div className="p-[15px] mb-5" style={{ background: '#fdf3ed', borderRadius: '4px' }}>
                  <p className="mb-3 text-[0.8rem] font-light uppercase tracking-[0.15em]" style={{ color: '#9a7060' }}>{storyEntries.length} moment{storyEntries.length !== 1 ? 's' : ''} added</p>
                  {storyEntries.map(entry => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 py-[8px] border-b border-[#e8d8cc] text-[0.9rem]">
                      <div>
                        <span className="font-semibold" style={{ color: TERRA }}>{entry.date_label}</span>
                        <span className="font-light ml-2" style={{ color: '#3d1f0e' }}>{entry.title}</span>
                      </div>
                      <button type="button" onClick={() => handleDeleteStoryEntry(entry.id)}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0906e' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddStoryEntry} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Date or Era *</label>
                  <input type="text" value={storyForm.date_label} onChange={e => setStoryForm(p => ({ ...p, date_label: e.target.value }))}
                    placeholder="e.g. March 2024 · We found out we were expecting!" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Title *</label>
                  <input type="text" value={storyForm.title} onChange={e => setStoryForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. The moment that changed everything" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>
                    Description <span className="font-normal normal-case tracking-normal" style={{ color: '#b0906e' }}>(optional)</span>
                  </label>
                  <textarea value={storyForm.description} onChange={e => setStoryForm(p => ({ ...p, description: e.target.value }))}
                    rows="2" placeholder="A little more about this moment..." className={inputClass} />
                </div>
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: `1px solid ${TERRA}`, color: TERRA, background: 'transparent', borderRadius: '4px' }}
                  disabled={addingEntry}>
                  {addingEntry ? 'Adding...' : '+ Add Moment'}
                </button>
              </form>
            </div>

            {/* Gift Registry */}
            <div style={card}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: TERRA }}>Registry</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Gift Registry Items</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a5a46' }}>Add individual gifts guests can browse and claim.</p>
              {giftError && (
                <div className="py-[15px] px-5 mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]" style={{ borderRadius: '4px' }}>{giftError}</div>
              )}
              {gifts.length > 0 && (
                <div className="p-[15px] mb-5" style={{ background: '#fdf3ed', borderRadius: '4px' }}>
                  <p className="mb-3 text-[0.8rem] font-light uppercase tracking-[0.15em]" style={{ color: '#9a7060' }}>{gifts.length} gift{gifts.length !== 1 ? 's' : ''} added</p>
                  {gifts.map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#e8d8cc] text-[0.9rem]">
                      <div className="flex gap-2 items-baseline">
                        <span className="font-light" style={{ color: '#3d1f0e' }}>{g.title}</span>
                        {g.price && <span className="font-semibold" style={{ color: TERRA }}>${parseFloat(g.price).toFixed(2)}</span>}
                      </div>
                      <button type="button" onClick={() => handleDeleteGift(g.id)}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0906e' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddGift} className="flex flex-col gap-3">
                <input type="text" value={giftForm.title} onChange={e => setGiftForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Gift title *" required className={inputClass} />
                <textarea value={giftForm.description} onChange={e => setGiftForm(p => ({ ...p, description: e.target.value }))}
                  rows="2" placeholder="Description (optional)" className={inputClass} />
                <input type="url" value={giftForm.link_url} onChange={e => setGiftForm(p => ({ ...p, link_url: e.target.value }))}
                  placeholder="Link to buy (optional)" className={inputClass} />
                <input type="number" value={giftForm.price} onChange={e => setGiftForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="Price (optional)" min="0" step="0.01" className={inputClass} />
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: `1px solid ${TERRA}`, color: TERRA, background: 'transparent', borderRadius: '4px' }}
                  disabled={addingGift}>
                  {addingGift ? 'Adding...' : '+ Add Gift'}
                </button>
              </form>
            </div>

            {/* Trivia */}
            <div style={card}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: TERRA }}>Trivia</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Trivia Questions</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a5a46' }}>
                Add fun questions about the parents-to-be. Guests play and compete on a leaderboard.
              </p>
              {triviaError && (
                <div className="py-[15px] px-5 mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]" style={{ borderRadius: '4px' }}>{triviaError}</div>
              )}
              {triviaQuestions.length > 0 && (
                <div className="p-[15px] mb-5" style={{ background: '#fdf3ed', borderRadius: '4px' }}>
                  <p className="mb-3 text-[0.8rem] font-light uppercase tracking-[0.15em]" style={{ color: '#9a7060' }}>{triviaQuestions.length} question{triviaQuestions.length !== 1 ? 's' : ''} added</p>
                  {triviaQuestions.map((q, i) => (
                    <div key={q.id || i} className="py-[6px] border-b border-[#e8d8cc] text-[0.9rem] font-light" style={{ color: '#3d1f0e' }}>
                      Q{i + 1}: {q.question}
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddTrivia} className="flex flex-col gap-3">
                <input type="text" value={triviaForm.question} onChange={e => setTriviaForm(p => ({ ...p, question: e.target.value }))}
                  placeholder="Question *" required className={inputClass} />
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt} className="flex gap-2 items-center">
                    <span className="font-semibold text-[0.85rem] w-5" style={{ color: TERRA }}>{opt.toUpperCase()}.</span>
                    <input type="text" value={triviaForm[`option_${opt}`]} onChange={e => setTriviaForm(p => ({ ...p, [`option_${opt}`]: e.target.value }))}
                      placeholder={`Option ${opt.toUpperCase()} *`} required className={inputClass} />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d1f0e' }}>Correct Answer *</label>
                  <select value={triviaForm.correct_answer} onChange={e => setTriviaForm(p => ({ ...p, correct_answer: e.target.value }))} className={inputClass}>
                    {['a', 'b', 'c', 'd'].map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                  </select>
                </div>
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: `1px solid ${TERRA}`, color: TERRA, background: 'transparent', borderRadius: '4px' }}
                  disabled={addingTrivia}>
                  {addingTrivia ? 'Adding...' : '+ Add Question'}
                </button>
              </form>
            </div>

            {/* FAQ */}
            <div style={card}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: TERRA }}>FAQ</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Frequently Asked Questions</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a5a46' }}>Answer common questions about parking, registry, gifts, dress code, etc.</p>
              {faqItems.length > 0 && (
                <div className="p-[15px] mb-5" style={{ background: '#fdf3ed', borderRadius: '4px' }}>
                  {faqItems.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#e8d8cc] text-[0.9rem]">
                      <span className="font-light truncate" style={{ color: '#3d1f0e' }}>{f.question}</span>
                      <button type="button" onClick={async () => { await deleteBabyShowerFAQItem(shower.slug, f.id, sessionToken); setFaqItems(prev => prev.filter(x => x.id !== f.id)); }}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0906e' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddFaq} className="flex flex-col gap-3">
                <input type="text" placeholder="Question *" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} required className={inputClass} />
                <textarea placeholder="Answer *" value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} rows="3" required className={inputClass} />
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: `1px solid ${TERRA}`, color: TERRA, background: 'transparent', borderRadius: '4px' }}
                  disabled={addingFaq}>
                  {addingFaq ? 'Adding...' : '+ Add FAQ'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default BabyShowerSetup;
