'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getBirthdayParty, getBirthdayTrivia, submitTriviaAnswers, getTriviaLeaderboard } from '../../api/api';
import './PartyFeature.css';

const PartyTrivia = ({ slug }) => {
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
    Promise.all([getBirthdayParty(slug), getBirthdayTrivia(slug), getTriviaLeaderboard(slug)])
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
      const res = await submitTriviaAnswers(slug, { player_name: playerName, answers });
      setResult(res.data);
      const lbRes = await getTriviaLeaderboard(slug);
      setLeaderboard(lbRes.data);
      setSubmitted(true);
    } catch {
      alert('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const color = party?.theme_color || '#ff6b9d';
  if (loading) return <div className="feature-loading">Loading...</div>;

  const maxScore = questions.reduce((s, q) => s + q.points, 0);

  return (
    <div className="party-feature-page">
      <div className="feature-header" style={{ background: `linear-gradient(135deg, ${color} 0%, #c850c0 100%)` }}>
        <div className="container">
          <Link href={`/birthday/${slug}`} className="back-link">← Back to Party</Link>
          <h1>🎯 Trivia</h1>
          <p>How well do you know {party?.birthday_person_name}?</p>
        </div>
      </div>

      <div className="container feature-content">
        {questions.length === 0 ? (
          <div className="empty-state">No trivia questions yet — check back soon!</div>
        ) : submitted ? (
          <div className="trivia-result">
            <h2>🎉 You scored {result?.score} / {maxScore}!</h2>
            <p>Nice work, {result?.player_name}!</p>
            <div className="trivia-answers-review">
              {result?.results?.map((r, i) => (
                <div key={i} className={`answer-review ${r.correct ? 'correct' : 'wrong'}`}>
                  <span>{r.correct ? '✓' : '✗'} Q{i + 1}: {r.correct ? 'Correct' : `Wrong — Answer was ${r.correct_answer.toUpperCase()}`}</span>
                  <span>{r.correct ? `+${r.points_earned}` : '0'} pts</span>
                </div>
              ))}
            </div>
          </div>
        ) : !started ? (
          <div className="trivia-start">
            <h3>Ready to play?</h3>
            <p>{questions.length} questions · Up to {maxScore} points</p>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="player-name-input"
            />
            <button
              className="btn btn-primary"
              style={{ background: color }}
              disabled={!playerName.trim()}
              onClick={() => setStarted(true)}
            >
              Start Trivia
            </button>
          </div>
        ) : (
          <div className="trivia-questions">
            {questions.map((q, i) => (
              <div key={q.id} className="trivia-question-card">
                <p className="question-text"><strong>Q{i + 1}.</strong> {q.question}</p>
                <div className="trivia-options">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <button
                      key={opt}
                      className={`trivia-option ${answers[q.id] === opt ? 'selected' : ''}`}
                      style={answers[q.id] === opt ? { background: color, borderColor: color, color: 'white' } : { borderColor: color }}
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                    >
                      <strong>{opt.toUpperCase()}.</strong> {q[`option_${opt}`]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="btn btn-primary"
              style={{ background: color }}
              disabled={submitting || Object.keys(answers).length < questions.length}
              onClick={handleSubmit}
            >
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>
            {Object.keys(answers).length < questions.length && (
              <p className="trivia-hint">Answer all {questions.length} questions to submit.</p>
            )}
          </div>
        )}

        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <h3>🏆 Leaderboard</h3>
            {leaderboard.map(entry => (
              <div key={entry.rank} className="leaderboard-entry">
                <span className="lb-rank">#{entry.rank}</span>
                <span className="lb-name">{entry.player_name}</span>
                <span className="lb-score" style={{ color }}>{entry.score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PartyTrivia;
