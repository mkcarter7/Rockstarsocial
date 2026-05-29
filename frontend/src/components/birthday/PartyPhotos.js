'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayPhotos, uploadBirthdayPhoto } from '../../api/api';
import './PartyFeature.css';

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
      .then(([partyRes, photosRes]) => {
        setParty(partyRes.data);
        setPhotos(photosRes.data);
        setLoading(false);
      })
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

  if (loading) return <div className="feature-loading">Loading...</div>;

  return (
    <div className="party-feature-page">
      <div className="feature-header" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        <div className="container">
          <Link href={`/birthday/${slug}`} className="back-link">← Back to Party</Link>
          <h1>📸 Photo Gallery</h1>
          <p>{party?.birthday_person_name}'s birthday memories</p>
        </div>
      </div>

      <div className="container feature-content">
        <div className="upload-section">
          <h3>Add a Photo</h3>
          <form onSubmit={handleUpload} className="upload-form">
            <input
              type="text"
              placeholder="Your name *"
              value={uploaderName}
              onChange={e => setUploaderName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files[0])}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
              style={{ background: color }}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          </form>
        </div>

        {photos.length === 0 ? (
          <div className="empty-state">No photos yet — be the first to add one!</div>
        ) : (
          <div className="photos-grid">
            {photos.map(photo => (
              <div key={photo.id} className="photo-card">
                <img src={photo.image} alt={photo.caption || 'Party photo'} />
                {photo.caption && <p className="photo-caption">{photo.caption}</p>}
                <p className="photo-uploader">📷 {photo.uploaded_by_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyPhotos;
