'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerPhotos, uploadBabyShowerPhoto } from '../../api/api';

const inputClass = "py-[10px] px-[14px] border border-[#d9c8bc] rounded-[4px] text-[0.95rem] font-[inherit] w-full outline-none focus:border-[#c17c5a]";

const BabyShowerPhotos = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
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
      setPhotos(prev => [res.data, ...prev]);
      setFile(null); setCaption(''); setUploaderName('');
      e.target.reset();
    } catch {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5 font-light" style={{ color: '#7a5a46' }}>Loading...</div>;

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
            {photos.map(photo => (
              <div key={photo.id} className="overflow-hidden bg-white" style={{ border: '1px solid rgba(193,124,90,0.15)', boxShadow: '0 2px 10px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
                <img src={photo.image} alt={photo.caption || 'Baby shower photo'} className="w-full h-[180px] object-cover" />
                {photo.caption && <p className="px-3 pt-2 pb-1 text-[0.9rem] font-light italic" style={{ color: '#5a3a2a' }}>{photo.caption}</p>}
                <p className="px-3 pb-[10px] text-[0.8rem] font-light" style={{ color: '#b0906e' }}>✦ {photo.uploaded_by_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyShowerPhotos;
