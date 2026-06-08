'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerGifts, claimBabyShowerGiftItem, unclaimBabyShowerGiftItem, deleteBabyShowerGiftItem } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#d9c8bc] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c17c5a]";

const ClaimModal = ({ gift, color, slug, onClose, onClaimed }) => {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await claimBabyShowerGiftItem(slug, gift.id, trimmed);
      onClaimed(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not claim this gift. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(61,31,14,0.5)' }} onClick={onClose}>
      <div className="bg-white p-8 w-full max-w-[400px]" style={{ boxShadow: `0 8px 40px ${color}30`, border: `1px solid ${color}40`, borderRadius: '4px' }} onClick={e => e.stopPropagation()}>
        <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Registry</p>
        <h3 className="text-[1.1rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Claim "{gift.title}"</h3>
        <p className="font-light text-[0.9rem] mb-5" style={{ color: '#7a5a46' }}>
          Enter your name so the parents know you're gifting this.
        </p>
        {error && <div className="py-2 px-4 mb-4 text-[0.9rem] font-light" style={{ background: '#fff5f5', color: '#c53030', border: '1px solid #fed7d7', borderRadius: '4px' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="text" placeholder="Your name *" value={name} onChange={e => setName(e.target.value)} required autoFocus className={inputClass} />
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-[10px] font-light text-[0.85rem] uppercase tracking-[0.1em] hover:opacity-70 transition-opacity"
              style={{ border: '1px solid #d9c8bc', color: '#9a7060', borderRadius: '4px' }}>Cancel</button>
            <button type="submit" disabled={submitting || !name.trim()}
              className="flex-1 py-[10px] font-semibold text-[0.85rem] uppercase tracking-[0.1em] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, color: '#fff', borderRadius: '4px' }}>
              {submitting ? 'Claiming...' : 'Claim Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GiftCard = ({ gift, color, isHost, sessionToken, slug, onClaim, onUnclaim, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const handleUnclaim = async () => {
    setWorking(true);
    try {
      const res = await unclaimBabyShowerGiftItem(slug, gift.id, sessionToken);
      onUnclaim(res.data);
    } catch { alert('Could not unclaim. Please try again.'); }
    setWorking(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setWorking(true);
    try {
      await deleteBabyShowerGiftItem(slug, gift.id, sessionToken);
      onDelete(gift.id);
    } catch { alert('Could not delete. Please try again.'); }
    setWorking(false);
    setConfirmDelete(false);
  };

  return (
    <div className={`bg-white p-5 flex flex-col gap-2 ${gift.claimed ? 'opacity-70' : ''}`}
      style={{ border: `1px solid ${gift.claimed ? '#d9c8bc' : color + '50'}`, boxShadow: '0 2px 8px rgba(100,60,20,0.06)', borderRadius: '4px' }}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h4 className="text-[1rem] font-light m-0" style={{ color: '#3d1f0e' }}>{gift.title}</h4>
          {gift.description && <p className="text-[0.9rem] font-light mt-1 mb-0" style={{ color: '#7a5a46' }}>{gift.description}</p>}
        </div>
        {gift.price && <span className="text-[0.95rem] font-semibold shrink-0" style={{ color }}>${parseFloat(gift.price).toFixed(2)}</span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {gift.link_url && (
          <a href={gift.link_url} target="_blank" rel="noreferrer"
            className="text-[0.85rem] font-light no-underline hover:underline" style={{ color }}>View / Buy →</a>
        )}
        {gift.claimed ? (
          <span className="text-[0.8rem] font-light px-3 py-1 rounded-full uppercase tracking-[0.1em]"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            {isHost && gift.claimed_by ? `Claimed by ${gift.claimed_by}` : 'Claimed'}
          </span>
        ) : (
          <button onClick={() => onClaim(gift)}
            className="text-[0.8rem] font-semibold py-1 px-4 uppercase tracking-[0.1em] hover:opacity-90 transition-opacity"
            style={{ background: color, color: '#fff', borderRadius: '4px' }}>
            Claim this gift
          </button>
        )}
        {isHost && gift.claimed && (
          <button onClick={handleUnclaim} disabled={working}
            className="text-[0.8rem] font-light underline hover:opacity-70 disabled:opacity-50 transition-opacity"
            style={{ color: '#b0906e' }}>{working ? '...' : 'Unclaim'}</button>
        )}
        {isHost && (
          <button onClick={handleDelete} disabled={working}
            className={`text-[0.8rem] font-light underline disabled:opacity-50 transition-opacity ml-auto ${confirmDelete ? 'font-semibold' : ''}`}
            style={{ color: confirmDelete ? '#c53030' : '#b0906e' }}>
            {working ? '...' : confirmDelete ? 'Tap again to confirm' : 'Remove'}
          </button>
        )}
        {isHost && confirmDelete && (
          <button onClick={() => setConfirmDelete(false)}
            className="text-[0.8rem] font-light underline hover:opacity-70 transition-opacity"
            style={{ color: '#b0906e' }}>Cancel</button>
        )}
      </div>
    </div>
  );
};

const BabyShowerGifts = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [registryLinks, setRegistryLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [claimTarget, setClaimTarget] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('hostToken');
    const hostSlug = localStorage.getItem('hostPartySlug');
    const hostIsOwner = !!(token && hostSlug === slug);
    setIsHost(hostIsOwner);
    setSessionToken(hostIsOwner ? token : '');

    Promise.all([getBabyShower(slug), getBabyShowerGifts(slug, hostIsOwner ? token : null)])
      .then(([partyRes, giftsRes]) => {
        setParty(partyRes.data);
        const links = partyRes.data.registry_links && partyRes.data.registry_links.length > 0
          ? partyRes.data.registry_links
          : partyRes.data.gift_registry_url
            ? [{ label: 'View Full Registry', url: partyRes.data.gift_registry_url }]
            : [];
        setRegistryLinks(links);
        setGifts(giftsRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleClaimed = (updated) => setGifts(prev => prev.map(g => g.id === updated.id ? updated : g));
  const handleUnclaimed = (updated) => setGifts(prev => prev.map(g => g.id === updated.id ? updated : g));
  const handleDeleted = (giftId) => setGifts(prev => prev.filter(g => g.id !== giftId));

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading...</div>;

  const unclaimed = gifts.filter(g => !g.claimed);
  const claimed = gifts.filter(g => g.claimed);

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[60px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : color }}>
            ← Back to Baby Shower
          </Link>
          <h1 className="text-[1.8rem] my-2 font-light tracking-[0.05em]"
            style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>Gift Registry</h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            Help celebrate {party?.parent_names || 'the parents-to-be'} with a thoughtful gift
          </p>
        </div>
      </div>

      <div className="container py-10">
        {(party.venmo_handle || party.cashapp_handle) && (
          <div className="p-8 mb-8 text-center" style={{ border: `1px solid ${color}30`, background: '#fff', boxShadow: '0 2px 16px rgba(100,60,20,0.07)', borderRadius: '4px' }}>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Send a Gift Directly 🎁</p>
            <h3 className="text-[1.1rem] font-light mb-2" style={{ color: '#3d1f0e' }}>Venmo or Cash App</h3>
            <p className="font-light text-[0.85rem] mb-6" style={{ color: '#7a5a46' }}>
              Send your gift directly to the parents-to-be — no account needed on their end.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {party.venmo_handle && (
                <a href={`https://venmo.com/${party.venmo_handle}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 py-3 px-7 font-semibold text-[0.9rem] hover:opacity-90 transition-opacity"
                  style={{ background: '#3D95CE', color: '#fff', borderRadius: '4px' }}>
                  <span>Venmo</span><span className="font-light opacity-80">@{party.venmo_handle}</span>
                </a>
              )}
              {party.cashapp_handle && (
                <a href={`https://cash.app/$${party.cashapp_handle}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 py-3 px-7 font-semibold text-[0.9rem] hover:opacity-90 transition-opacity"
                  style={{ background: '#00D632', color: '#fff', borderRadius: '4px' }}>
                  <span>Cash App</span><span className="font-light opacity-80">${party.cashapp_handle}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {registryLinks.length > 0 && (
          <div className="p-8 mb-8 text-center" style={{ border: `1px solid ${color}30`, background: '#fff', boxShadow: '0 2px 16px rgba(100,60,20,0.07)', borderRadius: '4px' }}>
            <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Gift Registries 🎁</p>
            <h3 className="text-[1.1rem] font-light mb-6" style={{ color: '#3d1f0e' }}>Shop the Registry</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {registryLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 py-3 px-7 font-semibold text-[0.9rem] hover:opacity-90 transition-opacity no-underline"
                  style={{ background: color, color: '#fff', borderRadius: '4px' }}>
                  {link.label || 'Registry'}
                </a>
              ))}
            </div>
          </div>
        )}

        {gifts.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0906e' }}>
            No gifts have been added yet — check back soon!
          </div>
        ) : (
          <>
            {unclaimed.length > 0 && (
              <div className="flex flex-col gap-4 mb-8">
                <p className="text-[0.7rem] uppercase tracking-[0.25em] font-light m-0" style={{ color: '#b0906e' }}>Available ({unclaimed.length})</p>
                {unclaimed.map(gift => (
                  <GiftCard key={gift.id} gift={gift} color={color} isHost={isHost} sessionToken={sessionToken}
                    slug={slug} onClaim={g => setClaimTarget(g)} onUnclaim={handleUnclaimed} onDelete={handleDeleted} />
                ))}
              </div>
            )}
            {claimed.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-[0.7rem] uppercase tracking-[0.25em] font-light m-0" style={{ color: '#b0906e' }}>Claimed ({claimed.length})</p>
                {claimed.map(gift => (
                  <GiftCard key={gift.id} gift={gift} color={color} isHost={isHost} sessionToken={sessionToken}
                    slug={slug} onClaim={() => {}} onUnclaim={handleUnclaimed} onDelete={handleDeleted} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {claimTarget && (
        <ClaimModal gift={claimTarget} color={color} slug={slug}
          onClose={() => setClaimTarget(null)}
          onClaimed={updated => { handleClaimed(updated); setClaimTarget(null); }} />
      )}
    </div>
  );
};

export default BabyShowerGifts;
