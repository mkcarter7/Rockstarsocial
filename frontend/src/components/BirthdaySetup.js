'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBirthdaySetup, saveBirthdaySetup, getBirthdayTrivia, addTriviaQuestion } from '../api/api';
import './BirthdaySetup.css';

const emptyQuestion = {
  question: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'a',
  points: 10,
};

const BirthdaySetup = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [themeColor, setThemeColor] = useState('#ff6b9d');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [bannerImage, setBannerImage] = useState(null);

  // Trivia
  const [questions, setQuestions] = useState([]);
  const [newQ, setNewQ] = useState(emptyQuestion);
  const [addingQ, setAddingQ] = useState(false);
  const [qError, setQError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please complete payment first.');
      setLoading(false);
      return;
    }
    Promise.all([getBirthdaySetup(sessionId), getBirthdaySetup(sessionId)])
      .then(([res]) => {
        setParty(res.data);
        setThemeColor(res.data.theme_color || '#ff6b9d');
        setWelcomeMessage(res.data.welcome_message || '');
        // Load existing trivia questions if party is active
        if (res.data.is_active) {
          return getBirthdayTrivia(res.data.slug).then(tRes => setQuestions(tRes.data));
        }
      })
      .catch(() => setError('Could not load your party. Please contact support.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('theme_color', themeColor);
    formData.append('welcome_message', welcomeMessage);
    if (bannerImage) formData.append('banner_image', bannerImage);

    try {
      await saveBirthdaySetup(formData);
      router.push(`/birthday/${party.slug}`);
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
      const res = await addTriviaQuestion(party.slug, { ...newQ, session_id: sessionId });
      setQuestions(prev => [...prev, res.data]);
      setNewQ(emptyQuestion);
    } catch (err) {
      setQError(err.response?.data?.error || 'Failed to add question. Please try again.');
    }
    setAddingQ(false);
  };

  if (loading) return <div className="birthday-setup-loading"><p>Loading your party...</p></div>;
  if (error && !party) return <div className="birthday-setup-error"><p>{error}</p></div>;

  return (
    <div className="birthday-setup-page">
      <section className="page-hero" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #c850c0 100%)` }}>
        <div className="container">
          <h1>🎉 Almost there, {party?.host_name}!</h1>
          <p>Customize {party?.birthday_person_name}'s party page before it goes live.</p>
        </div>
      </section>

      <section className="section">
        <div className="container setup-two-col">

          {/* Left: Party customization */}
          <div>
            <form onSubmit={handleSave} className="birthday-setup-form">
              {error && <div className="alert alert-error">{error}</div>}

              <div className="setup-preview">
                <h3>Your page URL:</h3>
                <a
                  href={`/birthday/${party?.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="party-url-preview"
                >
                  1rockstarsocial.com/birthday/{party?.slug}
                </a>
                <p className="setup-note">Your page is already live! Customize it below and click Save.</p>
              </div>

              <div className="form-group">
                <label>Theme Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="color-text"
                    placeholder="#ff6b9d"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="welcome_message">Welcome Message</label>
                <textarea
                  id="welcome_message"
                  value={welcomeMessage}
                  onChange={e => setWelcomeMessage(e.target.value)}
                  rows="4"
                  placeholder={`Welcome to ${party?.birthday_person_name}'s birthday celebration!`}
                />
              </div>

              <div className="form-group">
                <label htmlFor="banner_image">Banner Image (optional)</label>
                <input
                  type="file"
                  id="banner_image"
                  accept="image/*"
                  onChange={e => setBannerImage(e.target.files[0])}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large" disabled={saving}>
                {saving ? 'Saving...' : 'Save & Go to My Party Page'}
              </button>
            </form>
          </div>

          {/* Right: Trivia questions */}
          <div className="trivia-setup-section">
            <h2>🎯 Add Trivia Questions</h2>
            <p className="trivia-setup-intro">
              Create custom questions about {party?.birthday_person_name} for guests to answer.
              You can skip this and add questions later by visiting your party page.
            </p>

            {qError && <div className="alert alert-error">{qError}</div>}

            {questions.length > 0 && (
              <div className="questions-added">
                <h4>{questions.length} question{questions.length !== 1 ? 's' : ''} added:</h4>
                {questions.map((q, i) => (
                  <div key={q.id} className="question-added-item">
                    <span className="q-num">Q{i + 1}</span>
                    <span className="q-text">{q.question}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddQuestion} className="trivia-add-form">
              <div className="form-group">
                <label>Question *</label>
                <input
                  type="text"
                  value={newQ.question}
                  onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))}
                  placeholder="e.g. What is Kate's favorite movie?"
                  required
                />
              </div>

              <div className="trivia-options-grid">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt} className="form-group">
                    <label>Option {opt.toUpperCase()} *</label>
                    <input
                      type="text"
                      value={newQ[`option_${opt}`]}
                      onChange={e => setNewQ(p => ({ ...p, [`option_${opt}`]: e.target.value }))}
                      placeholder={`Option ${opt.toUpperCase()}`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="trivia-bottom-row">
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select
                    value={newQ.correct_answer}
                    onChange={e => setNewQ(p => ({ ...p, correct_answer: e.target.value }))}
                  >
                    <option value="a">A — {newQ.option_a || 'Option A'}</option>
                    <option value="b">B — {newQ.option_b || 'Option B'}</option>
                    <option value="c">C — {newQ.option_c || 'Option C'}</option>
                    <option value="d">D — {newQ.option_d || 'Option D'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newQ.points}
                    onChange={e => setNewQ(p => ({ ...p, points: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" disabled={addingQ}>
                {addingQ ? 'Adding...' : '+ Add Question'}
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
};

export default BirthdaySetup;
