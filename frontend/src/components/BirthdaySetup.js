'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBirthdaySetup, saveBirthdaySetup, getBirthdayTrivia, addTriviaQuestion, getBirthdayGifts, addGiftItem, deleteGiftItem } from '../api/api';

const inputClass = "py-[10px] px-3 border border-[#ddd] rounded-[6px] text-[0.9rem] font-[inherit] outline-none focus:border-brand w-full";

const emptyQuestion = { question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', points: 10 };

const BirthdaySetup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const sessionToken = searchParams.get('session_token');
  const isHostReturn = !!sessionToken;

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [themeColor, setThemeColor] = useState('#ff6b9d');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState(null);
  const [partyTime, setPartyTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [giftRegistryUrl, setGiftRegistryUrl] = useState('');
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState(emptyQuestion);
  const [addingQ, setAddingQ] = useState(false);
  const [qError, setQError] = useState('');
  const [gifts, setGifts] = useState([]);
  const [giftForm, setGiftForm] = useState({ title: '', description: '', link_url: '', price: '' });
  const [addingGift, setAddingGift] = useState(false);
  const [giftError, setGiftError] = useState('');

  useEffect(() => {
    if (!sessionId && !sessionToken) {
      setError('No session found. Please complete payment or log in first.');
      setLoading(false);
      return;
    }
    getBirthdaySetup(sessionId, sessionToken)
      .then((res) => {
        setParty(res.data);
        setThemeColor(res.data.theme_color || '#ff6b9d');
        setSecondaryColor(res.data.secondary_color || '#ffffff');
        setWelcomeMessage(res.data.welcome_message || '');
        setPartyTime(res.data.party_time || '');
        setLocationName(res.data.location_name || '');
        setLocationAddress(res.data.location_address || '');
        setGiftRegistryUrl(res.data.gift_registry_url || '');
        if (res.data.banner_image) setExistingBannerUrl(res.data.banner_image);
        if (res.data.is_active) {
          const token = isHostReturn ? sessionToken : null;
          return Promise.all([
            getBirthdayTrivia(res.data.slug),
            getBirthdayGifts(res.data.slug, token),
          ]).then(([tRes, gRes]) => {
            setQuestions(tRes.data);
            setGifts(gRes.data);
          });
        }
      })
      .catch(() => setError('Could not load your party. Please contact support.'))
      .finally(() => setLoading(false));
  }, [sessionId, sessionToken]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData();
    if (isHostReturn) {
      formData.append('session_token', sessionToken);
    } else {
      formData.append('session_id', sessionId);
    }
    formData.append('theme_color', themeColor);
    formData.append('secondary_color', secondaryColor);
    formData.append('welcome_message', welcomeMessage);
    if (bannerImage) formData.append('banner_image', bannerImage);
    formData.append('party_time', partyTime);
    formData.append('location_name', locationName);
    formData.append('location_address', locationAddress);
    formData.append('gift_registry_url', giftRegistryUrl);
    try {
      await saveBirthdaySetup(formData);
      router.push(`/${party.slug}`);
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setQError('');
    setAddingQ(true);
    try {
      const triviaData = isHostReturn
        ? { ...newQ, session_token: sessionToken }
        : { ...newQ, session_id: sessionId };
      const res = await addTriviaQuestion(party.slug, triviaData);
      setQuestions(prev => [...prev, res.data]);
      setNewQ(emptyQuestion);
    } catch (err) {
      setQError(err.response?.data?.error || 'Failed to add question. Please try again.');
    }
    setAddingQ(false);
  };

  const handleAddGift = async (e) => {
    e.preventDefault();
    setGiftError('');
    setAddingGift(true);
    try {
      const res = await addGiftItem(party.slug, { ...giftForm, session_token: sessionToken });
      setGifts(prev => [...prev, res.data]);
      setGiftForm({ title: '', description: '', link_url: '', price: '' });
    } catch (err) {
      setGiftError(err.response?.data?.error || 'Failed to add gift. Please try again.');
    }
    setAddingGift(false);
  };

  const handleDeleteGift = async (giftId) => {
    try {
      await deleteGiftItem(party.slug, giftId, sessionToken);
      setGifts(prev => prev.filter(g => g.id !== giftId));
    } catch {
      alert('Could not delete gift. Please try again.');
    }
  };

  if (loading) return <div className="text-center py-[60px] px-5"><p>Loading your party...</p></div>;
  if (error && !party) return <div className="text-center py-[60px] px-5"><p>{error}</p></div>;

  return (
    <div>
      <section
        className="py-[80px] text-center text-white relative overflow-hidden"
        style={
          bannerImagePreview || existingBannerUrl
            ? { backgroundImage: `url(${bannerImagePreview || existingBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: themeColor }
        }
      >
        {(bannerImagePreview || existingBannerUrl) && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
        )}
        <div className="container relative z-[1]">
          <h1>🎉 Almost there, {party?.host_name}!</h1>
          <p>Customize {party?.birthday_person_name}'s party page before it goes live.</p>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <form onSubmit={handleSave} className="max-w-[600px] mx-auto bg-white p-5 md:p-10 rounded-[12px] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
              {error && (
                <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{error}</div>
              )}

              <div className="bg-[#fff8ff] border-2 border-[#ff6b9d] rounded-[8px] p-5 mb-[30px] text-center">
                <h3 className="mb-[10px] text-[#333]">Your page URL:</h3>
                <a href={`/${party?.slug}`} target="_blank" rel="noreferrer" className="inline-block text-base text-[#ff6b9d] font-semibold break-all mb-[10px]">
                  1rockstarsocial.com/{party?.slug}
                </a>
                <p className="text-[0.85rem] text-[#888] m-0">Customize your page below, then click Save to make it live.</p>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-black">Hero Appearance</label>
                <p className="text-[0.8rem] text-[#888] -mt-1">Pick a color, or upload a photo — the photo will replace the gradient if both are set.</p>

                <div className="flex gap-[10px] items-center">
                  <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="w-[60px] h-10 border-2 border-[#ddd] rounded-[5px] cursor-pointer" />
                  <input type="text" value={themeColor} onChange={e => setThemeColor(e.target.value)} placeholder="#ff6b9d" className="flex-1 py-[10px] px-3 border border-[#ddd] rounded-[6px] font-mono text-[0.95rem] outline-none focus:border-brand" />
                </div>

                {(existingBannerUrl || bannerImagePreview) && (
                  <div className="relative w-full h-[90px] rounded-[6px] overflow-hidden border border-[#ddd]">
                    <img
                      src={bannerImagePreview || existingBannerUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-2 text-white text-[0.7rem] bg-[rgba(0,0,0,0.5)] px-2 py-[2px] rounded-full">
                      {bannerImagePreview ? 'New image' : 'Current image'}
                    </span>
                  </div>
                )}

                <label htmlFor="banner_image" className="font-semibold text-black text-[0.85rem]">
                  {existingBannerUrl ? 'Replace banner image' : 'Add a banner image'} <span className="text-[#aaa] font-normal">(optional)</span>
                </label>
                <input
                  type="file"
                  id="banner_image"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setBannerImage(file);
                      setBannerImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="py-[5px]"
                />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label className="font-semibold text-black">Page Background Color</label>
                <p className="text-[0.8rem] text-[#888] -mt-1">Shown below the header on all party pages. Defaults to white.</p>
                <div className="flex gap-[10px] items-center">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-[60px] h-10 border-2 border-[#ddd] rounded-[5px] cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} placeholder="#ffffff" className="flex-1 py-[10px] px-3 border border-[#ddd] rounded-[6px] font-mono text-[0.95rem] outline-none focus:border-brand" />
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="welcome_message" className="font-semibold text-black">Welcome Message</label>
                <textarea id="welcome_message" value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows="4" placeholder={`Welcome to ${party?.birthday_person_name}'s birthday celebration!`} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="party_time" className="font-semibold text-black">Party Time (optional)</label>
                <input type="time" id="party_time" value={partyTime} onChange={e => setPartyTime(e.target.value)} className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_name" className="font-semibold text-black">Venue Name (optional)</label>
                <input type="text" id="location_name" value={locationName} onChange={e => setLocationName(e.target.value)} placeholder="e.g. The Grand Ballroom" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="location_address" className="font-semibold text-black">Venue Address (optional)</label>
                <p className="text-[0.8rem] text-[#888] -mt-1">Used for the weather forecast and map on your party page.</p>
                <textarea id="location_address" value={locationAddress} onChange={e => setLocationAddress(e.target.value)} rows="3" placeholder="123 Party Lane, New York, NY 10001" className={inputClass} />
              </div>

              <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="gift_registry_url" className="font-semibold text-black">Gift Registry Link (optional)</label>
                <p className="text-[0.8rem] text-[#888] -mt-1">Paste a link to your Amazon wishlist, Target registry, Babylist, etc. Guests will see a button to view it.</p>
                <input type="url" id="gift_registry_url" value={giftRegistryUrl} onChange={e => setGiftRegistryUrl(e.target.value)} placeholder="https://www.amazon.com/hz/wishlist/..." className={inputClass} />
              </div>

              <button type="submit" className="btn btn-primary py-4 px-10 text-[1.1rem] disabled:opacity-60 disabled:cursor-not-allowed" disabled={saving}>
                {saving ? 'Saving...' : isHostReturn ? 'Save Changes' : 'Save & Go to My Party Page'}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-10">
          <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
            <h2 className="mb-2">🎁 Gift Registry Items</h2>
            <p className="text-[#666] text-[0.9rem] mb-5">
              Add individual gifts guests can browse and claim on your gift registry page.
            </p>

            {giftError && (
              <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{giftError}</div>
            )}

            {gifts.length > 0 && (
              <div className="bg-[#f8f8f8] rounded-[8px] p-[15px] mb-5">
                <h4 className="mb-[10px] text-[0.9rem] text-[#555]">{gifts.length} gift{gifts.length !== 1 ? 's' : ''} added:</h4>
                {gifts.map(g => (
                  <div key={g.id} className="flex items-center justify-between gap-3 py-[6px] border-b border-[#ececec] text-[0.9rem]">
                    <div className="flex gap-2 items-baseline">
                      <span className="text-[#444]">{g.title}</span>
                      {g.price && <span className="text-[#ff6b9d] font-semibold">${parseFloat(g.price).toFixed(2)}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteGift(g.id)}
                      className="text-[0.8rem] text-[#bbb] hover:text-[#c53030] underline transition-colors shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddGift} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-black text-[0.9rem]">Gift Title *</label>
                <input type="text" value={giftForm.title} onChange={e => setGiftForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Amazon Echo Dot" required className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-black text-[0.9rem]">Description <span className="text-[#aaa] font-normal">(optional)</span></label>
                <textarea value={giftForm.description} onChange={e => setGiftForm(p => ({ ...p, description: e.target.value }))} rows="2" placeholder="Any extra details..." className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-black text-[0.9rem]">Link to Buy <span className="text-[#aaa] font-normal">(optional)</span></label>
                <input type="url" value={giftForm.link_url} onChange={e => setGiftForm(p => ({ ...p, link_url: e.target.value }))} placeholder="https://amazon.com/..." className={inputClass} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-black text-[0.9rem]">Price <span className="text-[#aaa] font-normal">(optional)</span></label>
                <input type="number" value={giftForm.price} onChange={e => setGiftForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" min="0" step="0.01" className={inputClass} />
              </div>
              <button type="submit" className="btn btn-secondary disabled:opacity-60 disabled:cursor-not-allowed" disabled={addingGift}>
                {addingGift ? 'Adding...' : '+ Add Gift'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_15px_rgba(0,0,0,0.08)]">
            <h2 className="mb-2">🎯 Add Trivia Questions</h2>
            <p className="text-[#666] text-[0.9rem] mb-5">
              Create custom questions about {party?.birthday_person_name} for guests to answer.
              You can skip this and add questions later by visiting your party page.
            </p>

            {qError && (
              <div className="py-[15px] px-5 rounded-[5px] mb-5 bg-[#fed7d7] text-[#742a2a] border border-[#fc8181]">{qError}</div>
            )}

            {questions.length > 0 && (
              <div className="bg-[#f8f8f8] rounded-[8px] p-[15px] mb-5">
                <h4 className="mb-[10px] text-[0.9rem] text-[#555]">{questions.length} question{questions.length !== 1 ? 's' : ''} added:</h4>
                {questions.map((q, i) => (
                  <div key={q.id} className="flex gap-[10px] items-start py-[6px] border-b border-[#ececec] text-[0.9rem]">
                    <span className="font-bold text-[#ff6b9d] min-w-[25px]">Q{i + 1}</span>
                    <span className="text-[#444]">{q.question}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddQuestion} className="flex flex-col gap-[15px]">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-black text-[0.9rem]">Question *</label>
                <input type="text" value={newQ.question} onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))} placeholder="e.g. What is Kate's favorite movie?" required className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt} className="flex flex-col gap-1">
                    <label className="font-semibold text-black text-[0.9rem]">Option {opt.toUpperCase()} *</label>
                    <input type="text" value={newQ[`option_${opt}`]} onChange={e => setNewQ(p => ({ ...p, [`option_${opt}`]: e.target.value }))} placeholder={`Option ${opt.toUpperCase()}`} required className={inputClass} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-black text-[0.9rem]">Correct Answer *</label>
                  <select value={newQ.correct_answer} onChange={e => setNewQ(p => ({ ...p, correct_answer: e.target.value }))} className={inputClass}>
                    <option value="a">A — {newQ.option_a || 'Option A'}</option>
                    <option value="b">B — {newQ.option_b || 'Option B'}</option>
                    <option value="c">C — {newQ.option_c || 'Option C'}</option>
                    <option value="d">D — {newQ.option_d || 'Option D'}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-black text-[0.9rem]">Points</label>
                  <input type="number" min="5" max="50" value={newQ.points} onChange={e => setNewQ(p => ({ ...p, points: parseInt(e.target.value) }))} className={inputClass} />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary disabled:opacity-60 disabled:cursor-not-allowed" disabled={addingQ}>
                {addingQ ? 'Adding...' : '+ Add Question'}
              </button>
            </form>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BirthdaySetup;
