'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getBirthdayParty,
  getBirthdayGifts,
  addGiftItem,
  claimGiftItem,
  unclaimGiftItem,
  deleteGiftItem,
} from '../../api/api';

const featureInputClass =
  'py-[10px] px-[14px] border border-[#ddd] rounded-[6px] text-[0.95rem] font-[inherit] w-full';

// ─── Claim Modal ──────────────────────────────────────────────────────────────

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
      const res = await claimGiftItem(slug, gift.id, trimmed);
      onClaimed(res.data);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not claim this gift. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[14px] p-8 w-full max-w-[400px] shadow-[0_8px_40px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[1.2rem] mb-2 text-[#333]">Claim &ldquo;{gift.title}&rdquo;</h3>
        <p className="text-[#888] text-[0.9rem] mb-5">
          Enter your name so the host knows you&apos;re getting this.
        </p>
        {error && (
          <div className="py-2 px-4 rounded-[5px] mb-4 bg-[#fff5f5] text-[#c53030] border border-[#fed7d7] text-[0.9rem]">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className={featureInputClass}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-[10px] border-2 border-[#ddd] rounded-[6px] text-[#888] font-semibold hover:bg-[#f9f9f9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 py-[10px] text-white font-semibold rounded-[6px] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color }}
            >
              {submitting ? 'Claiming...' : 'Claim Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Add Gift Form (host only) ────────────────────────────────────────────────

const AddGiftForm = ({ slug, color, sessionToken, onAdded }) => {
  const [form, setForm] = useState({ title: '', description: '', link_url: '', price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await addGiftItem(slug, { ...form, session_token: sessionToken });
      onAdded(res.data);
      setForm({ title: '', description: '', link_url: '', price: '' });
      setOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not add gift. Please try again.');
    }
    setSubmitting(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-white font-semibold py-3 px-6 rounded-[8px] hover:opacity-90 transition-opacity mb-8"
        style={{ background: color }}
      >
        + Add Gift to Registry
      </button>
    );
  }

  return (
    <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-8">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-[1.2rem] m-0">Add a Gift</h3>
        <button
          onClick={() => setOpen(false)}
          className="text-[#aaa] hover:text-[#666] text-[1.5rem] leading-none"
        >
          &times;
        </button>
      </div>
      {error && (
        <div className="py-2 px-4 rounded-[5px] mb-4 bg-[#fff5f5] text-[#c53030] border border-[#fed7d7] text-[0.9rem]">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Gift title *"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          required
          className={featureInputClass}
        />
        <textarea
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows="2"
          className={featureInputClass}
        />
        <input
          type="url"
          placeholder="Link to buy (optional, e.g. Amazon URL)"
          value={form.link_url}
          onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))}
          className={featureInputClass}
        />
        <input
          type="number"
          placeholder="Price (optional)"
          value={form.price}
          min="0"
          step="0.01"
          onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
          className={featureInputClass}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-[10px] border-2 border-[#ddd] rounded-[6px] text-[#888] font-semibold hover:bg-[#f9f9f9] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-[10px] text-white font-semibold rounded-[6px] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            style={{ background: color }}
          >
            {submitting ? 'Adding...' : 'Add Gift'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Gift Card ────────────────────────────────────────────────────────────────

const GiftCard = ({ gift, color, isHost, sessionToken, slug, onClaim, onUnclaim, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [working, setWorking] = useState(false);

  const handleUnclaim = async () => {
    setWorking(true);
    try {
      const res = await unclaimGiftItem(slug, gift.id, sessionToken);
      onUnclaim(res.data);
    } catch {
      alert('Could not unclaim. Please try again.');
    }
    setWorking(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setWorking(true);
    try {
      await deleteGiftItem(slug, gift.id, sessionToken);
      onDelete(gift.id);
    } catch {
      alert('Could not delete. Please try again.');
    }
    setWorking(false);
    setConfirmDelete(false);
  };

  return (
    <div
      className={`bg-white rounded-[12px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col gap-2 border-2 ${gift.claimed ? 'opacity-70' : ''}`}
      style={{ borderColor: gift.claimed ? '#ddd' : color }}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h4 className="text-[1.05rem] font-semibold text-[#333] m-0">{gift.title}</h4>
          {gift.description && (
            <p className="text-[#666] text-[0.9rem] mt-1 mb-0">{gift.description}</p>
          )}
        </div>
        {gift.price && (
          <span className="text-[0.95rem] font-bold shrink-0" style={{ color }}>
            ${parseFloat(gift.price).toFixed(2)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        {gift.link_url && (
          <a
            href={gift.link_url}
            target="_blank"
            rel="noreferrer"
            className="text-[0.85rem] font-semibold no-underline hover:underline"
            style={{ color }}
          >
            View / Buy →
          </a>
        )}

        {gift.claimed ? (
          <span className="text-[0.85rem] bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] px-3 py-1 rounded-full font-semibold">
            {isHost && gift.claimed_by ? `Claimed by ${gift.claimed_by}` : 'Claimed'}
          </span>
        ) : (
          <button
            onClick={() => onClaim(gift)}
            className="text-[0.85rem] font-semibold py-1 px-3 rounded-full text-white hover:opacity-90 transition-opacity"
            style={{ background: color }}
          >
            Claim this gift
          </button>
        )}

        {isHost && gift.claimed && (
          <button
            onClick={handleUnclaim}
            disabled={working}
            className="text-[0.8rem] text-[#888] underline hover:text-[#555] disabled:opacity-50 transition-colors"
          >
            {working ? '...' : 'Unclaim'}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleDelete}
            disabled={working}
            className={`text-[0.8rem] underline disabled:opacity-50 transition-colors ml-auto ${
              confirmDelete ? 'text-[#c53030] font-semibold' : 'text-[#bbb] hover:text-[#888]'
            }`}
          >
            {working ? '...' : confirmDelete ? 'Tap again to confirm delete' : 'Delete'}
          </button>
        )}
        {isHost && confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-[0.8rem] text-[#aaa] underline hover:text-[#666] transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const PartyGifts = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [gifts, setGifts] = useState([]);
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

    Promise.all([
      getBirthdayParty(slug),
      getBirthdayGifts(slug, hostIsOwner ? token : null),
    ])
      .then(([partyRes, giftsRes]) => {
        setParty(partyRes.data);
        setGifts(giftsRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleGiftAdded = (newGift) => setGifts((prev) => [...prev, newGift]);
  const handleClaimed = (updatedGift) =>
    setGifts((prev) => prev.map((g) => (g.id === updatedGift.id ? updatedGift : g)));
  const handleUnclaimed = (updatedGift) =>
    setGifts((prev) => prev.map((g) => (g.id === updatedGift.id ? updatedGift : g)));
  const handleDeleted = (giftId) => setGifts((prev) => prev.filter((g) => g.id !== giftId));

  const color = party?.theme_color || '#ff6b9d';

  if (loading) return <div className="text-center py-[60px] px-5">Loading...</div>;

  const unclaimed = gifts.filter((g) => !g.claimed);
  const claimed = gifts.filter((g) => g.claimed);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="py-[50px] pb-10 text-white"
        style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}
      >
        <div className="container">
          <Link
            href={`/birthday/${slug}`}
            className="text-[rgba(255,255,255,0.85)] no-underline text-[0.9rem] inline-block mb-[10px] hover:text-white"
          >
            ← Back to Party
          </Link>
          <h1 className="text-[2rem] my-[10px] mb-[5px] text-white">🎁 Gift Registry</h1>
          <p className="opacity-90 m-0">
            Help celebrate {party?.birthday_person_name} with the perfect gift!
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-10">
        {isHost && (
          <AddGiftForm
            slug={slug}
            color={color}
            sessionToken={sessionToken}
            onAdded={handleGiftAdded}
          />
        )}

        {gifts.length === 0 ? (
          <div className="text-center py-[60px] px-5 text-[#888]">
            {isHost
              ? 'No gifts added yet. Add some above to get started!'
              : 'No gifts have been added to the registry yet — check back soon!'}
          </div>
        ) : (
          <>
            {unclaimed.length > 0 && (
              <div className="flex flex-col gap-4 mb-8">
                <h3 className="text-[1rem] uppercase tracking-widest font-semibold text-[#aaa] m-0">
                  Available ({unclaimed.length})
                </h3>
                {unclaimed.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    color={color}
                    isHost={isHost}
                    sessionToken={sessionToken}
                    slug={slug}
                    onClaim={(g) => setClaimTarget(g)}
                    onUnclaim={handleUnclaimed}
                    onDelete={handleDeleted}
                  />
                ))}
              </div>
            )}

            {claimed.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[1rem] uppercase tracking-widest font-semibold text-[#aaa] m-0">
                  Claimed ({claimed.length})
                </h3>
                {claimed.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    color={color}
                    isHost={isHost}
                    sessionToken={sessionToken}
                    slug={slug}
                    onClaim={() => {}}
                    onUnclaim={handleUnclaimed}
                    onDelete={handleDeleted}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {claimTarget && (
        <ClaimModal
          gift={claimTarget}
          color={color}
          slug={slug}
          onClose={() => setClaimTarget(null)}
          onClaimed={(updated) => {
            handleClaimed(updated);
            setClaimTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default PartyGifts;
