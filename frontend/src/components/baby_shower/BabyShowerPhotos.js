'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerPhotos, uploadBabyShowerPhoto, deleteBabyShowerPhoto } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const inputClass = "py-[10px] px-[14px] border border-[#d9c8bc] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c17c5a]";

const BabyShowerPhotos = ({ slug }) => {
  const { currentUser } = useAuth();
  const [party, setParty] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    Promise.all([getBabyShower(slug), getBabyShowerPhotos(slug)])
      .then(([partyRes, photosRes]) => { setParty(partyRes.data); setPhotos(photosRes.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !uploaderName.trim()) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('uploaded_by_name', uploaderName);
    formData.append('caption', caption);
    try {
      const res = await uploadBabyShowerPhoto(slug, formData);
      if (res.data.delete_token) {
        localStorage.setItem(`baby_shower_photo_token_${res.data.id}`, res.data.delete_token);
      }
      setPhotos(prev => [res.data, ...prev]);
      setFile(null); setCaption(''); setUploaderName('');
      e.target.reset();
    } catch {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    setDeletingId(photo.id);
    try {
      const hostToken = localStorage.getItem('hostToken');
      const hostSlug = localStorage.getItem('hostPartySlug');
      const uploaderToken = localStorage.getItem(`baby_shower_photo_token_${photo.id}`);

      if (uploaderToken) {
        await deleteBabyShowerPhoto(slug, photo.id, { deleteToken: uploaderToken });
        localStorage.removeItem(`baby_shower_photo_token_${photo.id}`);
      } else if (hostToken && hostSlug === slug) {
        await deleteBabyShowerPhoto(slug, photo.id, { sessionToken: hostToken });
      } else if (currentUser) {
        const firebaseToken = await currentUser.getIdToken();
        await deleteBabyShowerPhoto(slug, photo.id, { firebaseToken });
      } else {
        alert('Not authorized to delete this photo.');
        setDeletingId(null);
        return;
      }
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch {
      alert('Delete failed. Please try again.');
    }
    setDeletingId(null);
  };

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading...</div>;

  const hostToken = typeof window !== 'undefined' ? localStorage.getItem('hostToken') : null;
  const hostSlug = typeof window !== 'undefined' ? localStorage.getItem('hostPartySlug') : null;
  const isHost = hostToken && hostSlug === slug;
  const isAdmin = !!currentUser;

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
            style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>
            Photo Gallery
          </h1>
          <p className="font-light m-0" style={{ color: hasBanner ? 'rgba(255,255,255,0.8)' : '#7a5a46' }}>
            {party?.parent_names ? `${party.parent_names}'s baby shower memories` : 'Share your baby shower memories'}
          </p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white p-[30px] mb-10" style={{ border: '1px solid rgba(193,124,90,0.2)', boxShadow: '0 2px 16px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
          <p className="text-[0.65rem] uppercase tracking-[0.25em] font-light mb-1" style={{ color }}>Share a Moment</p>
          <h3 className="mb-5 text-[1.2rem] font-light" style={{ color: '#3d1f0e' }}>Add a Photo</h3>
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name *" value={uploaderName} onChange={e => setUploaderName(e.target.value)} required className={inputClass} />
            <input type="text" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} className={inputClass} />
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required className="py-[10px] font-light" style={{ color: '#5a3a2a' }} />
            <button type="submit"
              className="py-3 px-8 text-[0.85rem] uppercase tracking-[0.12em] font-semibold disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, color: '#fff', borderRadius: '4px' }}
              disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-[60px] px-5 font-light" style={{ color: '#b0906e' }}>
            No photos yet — be the first to share one!
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {photos.map(photo => {
              const uploaderToken = typeof window !== 'undefined' ? localStorage.getItem(`baby_shower_photo_token_${photo.id}`) : null;
              const canDelete = isHost || isAdmin || !!uploaderToken;
              return (
                <div key={photo.id} className="overflow-hidden bg-white relative" style={{ border: '1px solid rgba(193,124,90,0.15)', boxShadow: '0 2px 10px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(photo)}
                      disabled={deletingId === photo.id}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.8rem] leading-none disabled:opacity-50"
                      style={{ background: 'rgba(0,0,0,0.55)' }}
                      title="Delete photo"
                    >
                      {deletingId === photo.id ? '…' : '×'}
                    </button>
                  )}
                  <img src={photo.image} alt={photo.caption || 'Baby shower photo'} className="w-full aspect-[4/3] object-contain bg-[#f5f5f5]" />
                  {photo.caption && <p className="px-3 pt-2 pb-1 text-[0.9rem] font-light italic" style={{ color: '#5a3a2a' }}>{photo.caption}</p>}
                  <p className="px-3 pb-[10px] text-[0.8rem] font-light" style={{ color: '#b0906e' }}>✦ {photo.uploaded_by_name}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyShowerPhotos;
