'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getWeddingSetup, saveWeddingSetup,
  getWeddingStory, addStoryEntry, deleteStoryEntry,
  getWeddingGifts, addWeddingGiftItem, deleteWeddingGiftItem,
  getWeddingPartyMembers, addWeddingPartyMember, deleteWeddingPartyMember,
  getWeddingSchedule, addWeddingScheduleItem, deleteWeddingScheduleItem,
  getWeddingFAQ, addWeddingFAQItem, deleteWeddingFAQItem,
  getWeddingSongRequests, deleteWeddingSongRequest,
} from '../api/api';

const inputClass = "py-[10px] px-3 border border-[#e0d5c8] rounded-[4px] text-[0.9rem] font-[inherit] outline-none focus:border-[#c9a96e] w-full";

const WeddingSetup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const sessionToken = searchParams.get('session_token');
  const isHostReturn = !!sessionToken;

  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [themeColor, setThemeColor] = useState('#c9a96e');
  const [secondaryColor, setSecondaryColor] = useState('#fdfaf7');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState(null);
  const [ceremonyTime, setCeremonyTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [giftRegistryUrl, setGiftRegistryUrl] = useState('');
  const [venmoHandle, setVenmoHandle] = useState('');
  const [cashappHandle, setCashappHandle] = useState('');

  const [storyEntries, setStoryEntries] = useState([]);
  const [storyForm, setStoryForm] = useState({ date_label: '', title: '', description: '' });
  const [addingEntry, setAddingEntry] = useState(false);
  const [storyError, setStoryError] = useState('');

  const [gifts, setGifts] = useState([]);
  const [giftForm, setGiftForm] = useState({ title: '', description: '', link_url: '', price: '' });
  const [addingGift, setAddingGift] = useState(false);
  const [giftError, setGiftError] = useState('');

  const [partyMembers, setPartyMembers] = useState([]);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', bio: '', photo: null });
  const [addingMember, setAddingMember] = useState(false);

  const [scheduleItems, setScheduleItems] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({ name: '', event_date: '', event_time: '', location_name: '', description: '' });
  const [addingSchedule, setAddingSchedule] = useState(false);

  const [faqItems, setFaqItems] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [addingFaq, setAddingFaq] = useState(false);

  const [songRequests, setSongRequests] = useState([]);

  useEffect(() => {
    if (!sessionId && !sessionToken) {
      setError('No session found. Please complete payment or log in first.');
      setLoading(false);
      return;
    }
    getWeddingSetup(sessionId, sessionToken)
      .then((res) => {
        setWedding(res.data);
        setThemeColor(res.data.theme_color || '#c9a96e');
        setSecondaryColor(res.data.secondary_color || '#fdfaf7');
        setWelcomeMessage(res.data.welcome_message || '');
        setCeremonyTime(res.data.party_time || '');
        setLocationName(res.data.location_name || '');
        setLocationAddress(res.data.location_address || '');
        setGiftRegistryUrl(res.data.gift_registry_url || '');
        setVenmoHandle(res.data.venmo_handle || '');
        setCashappHandle(res.data.cashapp_handle || '');
        if (res.data.banner_image) setExistingBannerUrl(res.data.banner_image);
        if (res.data.is_active) {
          const token = isHostReturn ? sessionToken : null;
          return Promise.all([
            getWeddingStory(res.data.slug),
            getWeddingGifts(res.data.slug, token),
            getWeddingPartyMembers(res.data.slug),
            getWeddingSchedule(res.data.slug),
            getWeddingFAQ(res.data.slug),
            getWeddingSongRequests(res.data.slug),
          ]).then(([sRes, gRes, mRes, schRes, faqRes, songRes]) => {
            setStoryEntries(sRes.data);
            setGifts(gRes.data);
            setPartyMembers(mRes.data);
            setScheduleItems(schRes.data);
            setFaqItems(faqRes.data);
            setSongRequests(songRes.data);
          });
        }
      })
      .catch(() => setError('Could not load your wedding page. Please contact support.'))
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
    formData.append('party_time', ceremonyTime);
    formData.append('location_name', locationName);
    formData.append('location_address', locationAddress);
    formData.append('gift_registry_url', giftRegistryUrl);
    formData.append('venmo_handle', venmoHandle);
    formData.append('cashapp_handle', cashappHandle);
    try {
      await saveWeddingSetup(formData);
      router.push(`/w/${wedding.slug}`);
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
      const res = await addStoryEntry(wedding.slug, data);
      setStoryEntries(prev => [...prev, res.data]);
      setStoryForm({ date_label: '', title: '', description: '' });
    } catch (err) {
      setStoryError(err.response?.data?.error || 'Failed to add entry. Please try again.');
    }
    setAddingEntry(false);
  };

  const handleDeleteStoryEntry = async (entryId) => {
    try {
      await deleteStoryEntry(wedding.slug, entryId, sessionToken);
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
      const res = await addWeddingGiftItem(wedding.slug, { ...giftForm, session_token: sessionToken });
      setGifts(prev => [...prev, res.data]);
      setGiftForm({ title: '', description: '', link_url: '', price: '' });
    } catch (err) {
      setGiftError(err.response?.data?.error || 'Failed to add gift. Please try again.');
    }
    setAddingGift(false);
  };

  const handleDeleteGift = async (giftId) => {
    try {
      await deleteWeddingGiftItem(wedding.slug, giftId, sessionToken);
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch {
      alert('Could not delete gift. Please try again.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      const fd = new FormData();
      fd.append('session_token', sessionToken);
      fd.append('name', memberForm.name);
      fd.append('role', memberForm.role);
      fd.append('bio', memberForm.bio);
      if (memberForm.photo) fd.append('photo', memberForm.photo);
      const res = await addWeddingPartyMember(wedding.slug, fd);
      setPartyMembers(prev => [...prev, res.data]);
      setMemberForm({ name: '', role: '', bio: '', photo: null });
    } catch { alert('Could not add member. Please try again.'); }
    setAddingMember(false);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setAddingSchedule(true);
    try {
      const res = await addWeddingScheduleItem(wedding.slug, { ...scheduleForm, session_token: sessionToken });
      setScheduleItems(prev => [...prev, res.data]);
      setScheduleForm({ name: '', event_date: '', event_time: '', location_name: '', description: '' });
    } catch { alert('Could not add schedule item. Please try again.'); }
    setAddingSchedule(false);
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    setAddingFaq(true);
    try {
      const res = await addWeddingFAQItem(wedding.slug, { ...faqForm, session_token: sessionToken });
      setFaqItems(prev => [...prev, res.data]);
      setFaqForm({ question: '', answer: '' });
    } catch { alert('Could not add FAQ. Please try again.'); }
    setAddingFaq(false);
  };

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a6050' }}>Loading your wedding page...</div>;
  if (error && !wedding) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a6050' }}><p>{error}</p></div>;

  return (
    <div style={{ background: '#fdfaf7', minHeight: '100vh' }}>
      <section
        className="py-[80px] text-center relative overflow-hidden"
        style={
          bannerImagePreview || existingBannerUrl
            ? { backgroundImage: `url(${bannerImagePreview || existingBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #f9f4ef 0%, #e8c4b8 100%)' }
        }
      >
        {(bannerImagePreview || existingBannerUrl) && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        )}
        <div className="container relative z-[1]">
          <p className="text-[0.7rem] uppercase tracking-[0.3em] font-light mb-2"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? 'rgba(255,255,255,0.7)' : '#c9a96e' }}>
            Setup
          </p>
          <h1 className="text-[2rem] font-light tracking-[0.03em]"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? '#fff' : '#3d2c1e' }}>
            Almost there, {wedding?.host_name}
          </h1>
          <p className="font-light mt-2"
            style={{ color: (bannerImagePreview || existingBannerUrl) ? 'rgba(255,255,255,0.8)' : '#7a6050' }}>
            Personalize {wedding?.couple_name || 'your'}'s wedding page before it goes live.
          </p>
        </div>
      </section>

      <section className="section" style={{ background: '#fdfaf7' }}>
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── Left: Main form ── */}
          <div>
            <form
              onSubmit={handleSave}
              className="max-w-[600px] mx-auto bg-white p-5 md:p-10 rounded-[4px]"
              style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}
            >
              {error && (
                <div className="py-[15px] px-5 rounded-[4px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{error}</div>
              )}

              <div className="p-5 mb-8 text-center rounded-[4px]" style={{ background: '#fdf6ec', border: '1px solid #c9a96e' }}>
                <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Your Page URL</p>
                <a href={`/w/${wedding?.slug}`} target="_blank" rel="noreferrer"
                  className="inline-block text-base font-light break-all mb-1" style={{ color: '#c9a96e' }}>
                  1rockstarsocial.com/{wedding?.slug}
                </a>
                <p className="text-[0.8rem] font-light m-0" style={{ color: '#9a8070' }}>Customize your page below, then click Save to make it live.</p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Hero Appearance</label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Choose a color for the hero section, or upload a photo — the photo takes priority if both are set.</p>
                <div className="flex gap-[10px] items-center">
                  <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-[60px] h-10 border border-[#e0d5c8] rounded-[4px] cursor-pointer" />
                  <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} placeholder="#c9a96e" className="flex-1 py-[10px] px-3 border border-[#e0d5c8] rounded-[4px] font-mono text-[0.95rem] outline-none focus:border-[#c9a96e]" />
                </div>

                {(existingBannerUrl || bannerImagePreview) && (
                  <div className="relative w-full h-[90px] rounded-[4px] overflow-hidden border border-[#e0d5c8]">
                    <img src={bannerImagePreview || existingBannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-2 text-white text-[0.7rem] bg-[rgba(0,0,0,0.5)] px-2 py-[2px] rounded-full">
                      {bannerImagePreview ? 'New image' : 'Current image'}
                    </span>
                  </div>
                )}

                <label htmlFor="banner_image" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>
                  {existingBannerUrl ? 'Replace banner image' : 'Add a banner image'} <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span>
                </label>
                <input type="file" id="banner_image" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (file) { setBannerImage(file); setBannerImagePreview(URL.createObjectURL(file)); }
                }} className="py-[5px]" />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Page Background Color</label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Shown below the hero on all pages. Defaults to warm ivory.</p>
                <div className="flex gap-[10px] items-center">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-[60px] h-10 border border-[#e0d5c8] rounded-[4px] cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} placeholder="#fdfaf7" className="flex-1 py-[10px] px-3 border border-[#e0d5c8] rounded-[4px] font-mono text-[0.95rem] outline-none focus:border-[#c9a96e]" />
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="welcome_message" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Welcome Message</label>
                <textarea id="welcome_message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows="4"
                  placeholder={`Join us as ${wedding?.couple_name || 'we'} say I do`}
                  className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="ceremony_time" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Ceremony Time <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <input type="time" id="ceremony_time" value={ceremonyTime} onChange={e => setCeremonyTime(e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_name" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Venue Name <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <input type="text" id="location_name" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. The Grand Ballroom" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_address" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Venue Address <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Used for the weather forecast and map on your wedding page.</p>
                <textarea id="location_address" value={locationAddress} onChange={e => setLocationAddress(e.target.value)} rows="3"
                  placeholder="123 Garden Lane, Charleston, SC 29401" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="gift_registry_url" className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Registry Link <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Paste a link to your Zola, The Knot, Amazon, or any other registry. Guests will see a button to view it.</p>
                <input type="url" id="gift_registry_url" value={giftRegistryUrl} onChange={e => setGiftRegistryUrl(e.target.value)} placeholder="https://www.zola.com/registry/..." className={inputClass} />

                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em] mt-2" style={{ color: '#3d2c1e' }}>Venmo Handle <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Guests can tap to send a gift directly via Venmo. Enter your handle without the @.</p>
                <input type="text" value={venmoHandle} onChange={e => setVenmoHandle(e.target.value.replace(/^@/, ''))} placeholder="yourhandle" className={inputClass} />

                <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em] mt-2" style={{ color: '#3d2c1e' }}>Cash App Handle <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                <p className="text-[0.8rem] font-light -mt-1" style={{ color: '#9a8070' }}>Guests can tap to send a gift directly via Cash App. Enter your $cashtag without the $.</p>
                <input type="text" value={cashappHandle} onChange={e => setCashappHandle(e.target.value.replace(/^\$/, ''))} placeholder="yourcashtag" className={inputClass} />
              </div>

              <button type="submit"
                className="w-full py-4 px-10 text-[0.9rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: '#c9a96e', color: '#fff' }}
                disabled={saving}>
                {saving ? 'Saving...' : isHostReturn ? 'Save Changes' : 'Save & Go to My Wedding Page'}
              </button>
            </form>
          </div>

          {/* ── Right: Story + Gifts ── */}
          <div className="flex flex-col gap-10">

            {/* Our Story entries */}
            <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Our Story</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Story Timeline</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>
                Add moments from your journey together — guests will read them on a beautiful vertical timeline.
                You can add more entries later from your dashboard.
              </p>

              {storyError && (
                <div className="py-[15px] px-5 rounded-[4px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{storyError}</div>
              )}

              {storyEntries.length > 0 && (
                <div className="rounded-[4px] p-[15px] mb-5" style={{ background: '#faf7f3' }}>
                  <p className="mb-3 text-[0.8rem] font-light uppercase tracking-[0.15em]" style={{ color: '#9a8070' }}>{storyEntries.length} moment{storyEntries.length !== 1 ? 's' : ''} added</p>
                  {storyEntries.map(entry => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 py-[8px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <div>
                        <span className="font-semibold" style={{ color: '#c9a96e' }}>{entry.date_label}</span>
                        <span className="font-light ml-2" style={{ color: '#3d2c1e' }}>{entry.title}</span>
                      </div>
                      <button type="button" onClick={() => handleDeleteStoryEntry(entry.id)}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70 transition-opacity" style={{ color: '#b0a090' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddStoryEntry} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Date or Era *</label>
                  <input type="text" value={storyForm.date_label} onChange={e => setStoryForm(p => ({ ...p, date_label: e.target.value }))}
                    placeholder="e.g. June 2018 · The Summer We Met" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Title *</label>
                  <input type="text" value={storyForm.title} onChange={e => setStoryForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. We met at a coffee shop in Nashville" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Description <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                  <textarea value={storyForm.description} onChange={e => setStoryForm(p => ({ ...p, description: e.target.value }))}
                    rows="2" placeholder="A little more detail about this moment..." className={inputClass} />
                </div>
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #c9a96e', color: '#c9a96e', background: 'transparent' }}
                  disabled={addingEntry}>
                  {addingEntry ? 'Adding...' : '+ Add Moment'}
                </button>
              </form>
            </div>

            {/* Registry gift items */}
            <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Registry</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Gift Registry Items</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>
                Add individual gifts guests can browse and claim on your registry page.
              </p>

              {giftError && (
                <div className="py-[15px] px-5 rounded-[4px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{giftError}</div>
              )}

              {gifts.length > 0 && (
                <div className="rounded-[4px] p-[15px] mb-5" style={{ background: '#faf7f3' }}>
                  <p className="mb-3 text-[0.8rem] font-light uppercase tracking-[0.15em]" style={{ color: '#9a8070' }}>{gifts.length} gift{gifts.length !== 1 ? 's' : ''} added</p>
                  {gifts.map(g => (
                    <div key={g.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <div className="flex gap-2 items-baseline">
                        <span className="font-light" style={{ color: '#3d2c1e' }}>{g.title}</span>
                        {g.price && <span className="font-semibold" style={{ color: '#c9a96e' }}>${parseFloat(g.price).toFixed(2)}</span>}
                      </div>
                      <button type="button" onClick={() => handleDeleteGift(g.id)}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70 transition-opacity" style={{ color: '#b0a090' }}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddGift} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Gift Title *</label>
                  <input type="text" value={giftForm.title} onChange={e => setGiftForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. KitchenAid Stand Mixer" required className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Description <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                  <textarea value={giftForm.description} onChange={e => setGiftForm(p => ({ ...p, description: e.target.value }))}
                    rows="2" placeholder="Any extra details..." className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Link to Buy <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                  <input type="url" value={giftForm.link_url} onChange={e => setGiftForm(p => ({ ...p, link_url: e.target.value }))}
                    placeholder="https://www.amazon.com/..." className={inputClass} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-[0.85rem] uppercase tracking-[0.1em]" style={{ color: '#3d2c1e' }}>Price <span className="font-normal normal-case tracking-normal" style={{ color: '#b0a090' }}>(optional)</span></label>
                  <input type="number" value={giftForm.price} onChange={e => setGiftForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01" className={inputClass} />
                </div>
                <button type="submit"
                  className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #c9a96e', color: '#c9a96e', background: 'transparent' }}
                  disabled={addingGift}>
                  {addingGift ? 'Adding...' : '+ Add Gift'}
                </button>
              </form>
            </div>

            {/* Wedding Party Members */}
            <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Wedding Party</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Wedding Party Members</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>Add bridesmaids, groomsmen, and other special members of your party.</p>
              {partyMembers.length > 0 && (
                <div className="rounded-[4px] p-[15px] mb-5" style={{ background: '#faf7f3' }}>
                  {partyMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <div>
                        <span className="font-light" style={{ color: '#3d2c1e' }}>{m.name}</span>
                        <span className="text-[0.8rem] ml-2" style={{ color: '#c9a96e' }}>{m.role}</span>
                      </div>
                      <button type="button" onClick={async () => { await deleteWeddingPartyMember(wedding.slug, m.id, sessionToken); setPartyMembers(prev => prev.filter(x => x.id !== m.id)); }}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0a090' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddMember} className="flex flex-col gap-3">
                <input type="text" placeholder="Name *" value={memberForm.name} onChange={e => setMemberForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
                <input type="text" placeholder="Role * (e.g. Maid of Honor, Best Man)" value={memberForm.role} onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))} required className={inputClass} />
                <input type="text" placeholder="Short bio (optional)" value={memberForm.bio} onChange={e => setMemberForm(p => ({ ...p, bio: e.target.value }))} className={inputClass} />
                <div className="flex flex-col gap-1">
                  <label className="text-[0.8rem] font-light" style={{ color: '#9a8070' }}>Photo (optional)</label>
                  <input type="file" accept="image/*" onChange={e => setMemberForm(p => ({ ...p, photo: e.target.files[0] || null }))} className="text-[0.85rem]" />
                </div>
                <button type="submit" className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #c9a96e', color: '#c9a96e', background: 'transparent' }} disabled={addingMember}>
                  {addingMember ? 'Adding...' : '+ Add Member'}
                </button>
              </form>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Schedule</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Event Schedule</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>Add each part of your wedding day (ceremony, cocktail hour, reception, etc.).</p>
              {scheduleItems.length > 0 && (
                <div className="rounded-[4px] p-[15px] mb-5" style={{ background: '#faf7f3' }}>
                  {scheduleItems.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <div>
                        <span className="font-light" style={{ color: '#3d2c1e' }}>{s.name}</span>
                        {s.event_time && <span className="text-[0.8rem] ml-2" style={{ color: '#c9a96e' }}>{s.event_time}</span>}
                      </div>
                      <button type="button" onClick={async () => { await deleteWeddingScheduleItem(wedding.slug, s.id, sessionToken); setScheduleItems(prev => prev.filter(x => x.id !== s.id)); }}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0a090' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddSchedule} className="flex flex-col gap-3">
                <input type="text" placeholder="Event name * (e.g. Ceremony)" value={scheduleForm.name} onChange={e => setScheduleForm(p => ({ ...p, name: e.target.value }))} required className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.75rem] font-light uppercase tracking-wide" style={{ color: '#9a8070' }}>Date (optional)</label>
                    <input type="date" value={scheduleForm.event_date} onChange={e => setScheduleForm(p => ({ ...p, event_date: e.target.value }))} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[0.75rem] font-light uppercase tracking-wide" style={{ color: '#9a8070' }}>Time (optional)</label>
                    <input type="time" value={scheduleForm.event_time} onChange={e => setScheduleForm(p => ({ ...p, event_time: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <input type="text" placeholder="Location name (optional)" value={scheduleForm.location_name} onChange={e => setScheduleForm(p => ({ ...p, location_name: e.target.value }))} className={inputClass} />
                <textarea placeholder="Description (optional)" value={scheduleForm.description} onChange={e => setScheduleForm(p => ({ ...p, description: e.target.value }))} rows="2" className={inputClass} />
                <button type="submit" className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #c9a96e', color: '#c9a96e', background: 'transparent' }} disabled={addingSchedule}>
                  {addingSchedule ? 'Adding...' : '+ Add Event'}
                </button>
              </form>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>FAQ</p>
              <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Frequently Asked Questions</h2>
              <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>Answer common questions about dress code, parking, kids policy, etc.</p>
              {faqItems.length > 0 && (
                <div className="rounded-[4px] p-[15px] mb-5" style={{ background: '#faf7f3' }}>
                  {faqItems.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <span className="font-light truncate" style={{ color: '#3d2c1e' }}>{f.question}</span>
                      <button type="button" onClick={async () => { await deleteWeddingFAQItem(wedding.slug, f.id, sessionToken); setFaqItems(prev => prev.filter(x => x.id !== f.id)); }}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0a090' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAddFaq} className="flex flex-col gap-3">
                <input type="text" placeholder="Question *" value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} required className={inputClass} />
                <textarea placeholder="Answer *" value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} rows="3" required className={inputClass} />
                <button type="submit" className="py-3 px-6 text-[0.85rem] uppercase tracking-[0.1em] font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ border: '1px solid #c9a96e', color: '#c9a96e', background: 'transparent' }} disabled={addingFaq}>
                  {addingFaq ? 'Adding...' : '+ Add FAQ'}
                </button>
              </form>
            </div>

            {/* Song Requests (read-only view) */}
            {songRequests.length > 0 && (
              <div className="bg-white rounded-[4px] p-[30px]" style={{ border: '1px solid rgba(201,169,110,0.2)', boxShadow: '0 2px 20px rgba(201,169,110,0.08)' }}>
                <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color: '#c9a96e' }}>Playlist</p>
                <h2 className="text-[1.3rem] font-light mb-2" style={{ color: '#3d2c1e' }}>Song Requests</h2>
                <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a6050' }}>{songRequests.length} request{songRequests.length !== 1 ? 's' : ''} from guests.</p>
                <div className="flex flex-col gap-2">
                  {songRequests.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#f0e8dc] text-[0.9rem]">
                      <div>
                        <span className="font-light" style={{ color: '#3d2c1e' }}>{r.song_title}</span>
                        {r.artist && <span className="text-[0.8rem] ml-2" style={{ color: '#9a8070' }}>— {r.artist}</span>}
                        {r.requested_by && <span className="text-[0.75rem] ml-2" style={{ color: '#b0a090' }}>by {r.requested_by}</span>}
                      </div>
                      <button type="button" onClick={async () => { await deleteWeddingSongRequest(wedding.slug, r.id, sessionToken); setSongRequests(prev => prev.filter(x => x.id !== r.id)); }}
                        className="text-[0.8rem] font-light underline shrink-0 hover:opacity-70" style={{ color: '#b0a090' }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
};

export default WeddingSetup;
