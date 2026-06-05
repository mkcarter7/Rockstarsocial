'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBabyShower, getBabyShowerTrivia, submitBabyShowerTrivia, getBabyShowerTriviaLeaderboard } from '../../api/api';

const BabyShowerTrivia = ({ slug }) => {
  const [party, setParty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getBabyShower(slug), getBabyShowerTrivia(slug), getBabyShowerTriviaLeaderboard(slug)])
      .then(([partyRes, triviaRes, lbRes]) => {
        setParty(partyRes.data);
        setQuestions(triviaRes.data);
        setLeaderboard(lbRes.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async () => {
    if (!playerName.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitBabyShowerTrivia(slug, { player_name: playerName, answers });
      setResult(res.data);
      const lbRes = await getBabyShowerTriviaLeaderboard(slug);
      setLeaderboard(lbRes.data);
      setSubmitted(true);
    } catch {
      alert('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const color = party?.theme_color || '#c17c5a';
  const secondaryColor = party?.secondary_color || '#faf6f0';
  const heroStyle = party?.banner_image
    ? { backgroundImage: `url(${party.banner_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #f7ede4 0%, #f0e6d6 100%)' };
  const hasBanner = !!party?.banner_image;

  if (loading) return <div className="text-center py-[60px] px-5">Loading...</div>;

  const maxScore = questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="min-h-screen" style={{ background: secondaryColor }}>
      <div className="py-[50px] pb-10 relative overflow-hidden" style={heroStyle}>
        {hasBanner && <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />}
        <div className="container relative z-[1]">
          <Link href={`/${slug}`} className="no-underline text-[0.8rem] uppercase tracking-[0.15em] font-light inline-block mb-3 hover:opacity-80 transition-opacity"
            style={{ color: hasBanner ? 'rgba(255,255,255,0.85)' : color }}>
            ← Back to Baby Shower
          </Link>
          <h1 className="text-[2rem] my-[10px] mb-[5px]" style={{ color: hasBanner ? '#fff' : '#3d1f0e' }}>🎯 Trivia</h1>
          <p style={{ color: hasBanner ? 'rgba(255,255,255,0.9)' : '#7a5a46' }} className="opacity-90 m-0">
            How well do you know {party?.parent_names || 'the parents-to-be'}?
          </p>
        </div>
      </div>

      <div className="container py-10">
        {questions.length === 0 ? (
          <div className="text-center py-[60px] px-5" style={{ color: '#b0906e' }}>No trivia questions yet — check back soon!</div>
        ) : submitted ? (
          <div className="bg-white p-10 text-center mb-10" style={{ boxShadow: '0 2px 12px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
            <h2 className="text-[1.8rem] mb-[10px]">🎉 You scored {result?.score} / {maxScore}!</h2>
            <p>Nice work, {result?.player_name}!</p>
            <div className="mt-[25px] text-left flex flex-col gap-2">
              {result?.results?.map((r, i) => (
                <div key={i} className={`flex justify-between py-[10px] px-[15px] text-[0.9rem] ${r.correct ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#fef2f2] text-[#dc2626]'}`}
                  style={{ borderRadius: '4px' }}>
                  <span>{r.correct ? '✓' : '✗'} Q{i + 1}: {r.correct ? 'Correct' : `Wrong — Answer was ${r.correct_answer.toUpperCase()}`}</span>
                  <span>{r.correct ? `+${r.points_earned}` : '0'} pts</span>
                </div>
              ))}
            </div>
          </div>
        ) : !started ? (
          <div className="text-center bg-white py-[50px] px-[30px] mb-10" style={{ boxShadow: '0 2px 12px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
            <h3 className="text-[1.5rem] mb-[10px]">Ready to play?</h3>
            <p className="mb-5" style={{ color: '#7a5a46' }}>{questions.length} questions · Up to {maxScore} points</p>
            <input
              type="text" placeholder="Your name" value={playerName} onChange={e => setPlayerName(e.target.value)}
              className="block w-full max-w-[300px] mx-auto mb-5 py-3 px-4 border border-[#d9c8bc] text-base text-center outline-none focus:border-[#c17c5a]"
              style={{ borderRadius: '4px' }}
            />
            <button
              className="py-3 px-8 font-semibold text-white uppercase tracking-[0.1em] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, borderRadius: '4px' }}
              disabled={!playerName.trim()} onClick={() => setStarted(true)}>
              Start Trivia
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white p-[25px]" style={{ boxShadow: '0 2px 10px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
                <p className="text-[1.05rem] mb-[15px]" style={{ color: '#3d1f0e' }}><strong>Q{i + 1}.</strong> {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <button key={opt}
                      className="py-3 px-[15px] border-2 bg-white text-left cursor-pointer text-[0.9rem] transition-all duration-200 hover:opacity-85"
                      style={answers[q.id] === opt
                        ? { background: color, borderColor: color, color: 'white', borderRadius: '4px' }
                        : { borderColor: color, borderRadius: '4px' }}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}>
                      <strong>{opt.toUpperCase()}.</strong> {q[`option_${opt}`]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="py-4 px-8 font-semibold text-white uppercase tracking-[0.1em] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              style={{ background: color, borderRadius: '4px' }}
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}>
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
            {Object.keys(answers).length < questions.length && (
              <p className="text-[0.85rem] text-center" style={{ color: '#b0906e' }}>Answer all {questions.length} questions to submit.</p>
            )}
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="bg-white p-[30px] mt-10" style={{ boxShadow: '0 2px 10px rgba(100,60,20,0.08)', borderRadius: '4px' }}>
            <h3 className="mb-5 text-[1.2rem]" style={{ color: '#3d1f0e' }}>🏆 Leaderboard</h3>
            {leaderboard.map(entry => (
              <div key={entry.rank} className="flex items-center gap-[15px] py-3 border-b border-[#ede0d4]">
                <span className="font-bold min-w-[30px]" style={{ color: '#b0906e' }}>#{entry.rank}</span>
                <span className="flex-1" style={{ color: '#3d1f0e' }}>{entry.player_name}</span>
                <span className="font-bold" style={{ color }}>{entry.score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BabyShowerTrivia;
