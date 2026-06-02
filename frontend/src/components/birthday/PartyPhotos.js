'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayPhotos, uploadBirthdayPhoto } from '../../api/api';

const featureInputClass = "py-[10px] px-[14px] border border-[#ddd] rounded-[6px] text-[0.95rem] font-[inherit] w-full";

const PartyPhotos = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    Promise.all([getBirthdayParty(slug), getBirthdayPhotos(slug)])
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
      const res = await uploadBirthdayPhoto(slug, formData);
      setPhotos(prev => [res.data, ...prev]);
      setFile(null);
      setCaption('');
      setUploaderName('');
      e.target.reset();
    } catch {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const color = party?.theme_color || '#ff6b9d';
  const secondaryColor = party?.secondary_color || '#ffffff';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: color };
  if (loading) return <div className="text-center py-[60px] px-5">Loading...</div>;

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[50px] pb-10 text-white relative overflow-hidden" style={heroStyle}>
        {party?.banner_image && (
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
        )}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="text-[rgba(255,255,255,0.85)] no-underline text-[0.9rem] inline-block mb-[10px] hover:text-white">← Back to Party</Link>
          <h1 className="text-[2rem] my-[10px] mb-[5px] text-white">📸 Photo Gallery</h1>
          <p className="opacity-90 m-0">{party?.birthday_person_name}'s birthday memories</p>
        </div>
      </div>

      <div className="container py-10">
        <div className="bg-white rounded-[12px] p-[30px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-10">
          <h3 className="mb-5 text-[1.2rem]">Add a Photo</h3>
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <input type="text" placeholder="Your name *" value={uploaderName} onChange={e => setUploaderName(e.target.value)} required className={featureInputClass} />
            <input type="text" placeholder="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} className={featureInputClass} />
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} required className="py-[10px]" />
            <button type="submit" className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={uploading} style={{ background: color }}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-[60px] px-5 text-[#888]">No photos yet — be the first to add one!</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
            {photos.map(photo => (
              <div key={photo.id} className="rounded-[10px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.08)] bg-white">
                <img src={photo.image} alt={photo.caption || 'Party photo'} className="w-full h-[180px] object-cover" />
                {photo.caption && <p className="px-3 pt-2 pb-1 text-[0.9rem] text-[#444]">{photo.caption}</p>}
                <p className="px-3 pb-[10px] text-[0.8rem] text-[#888]">📷 {photo.uploaded_by_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyPhotos;
