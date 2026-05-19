import { useState, useEffect, useRef, useCallback } from 'react';
import { TEAM_COLORS } from './SetupPage.jsx';
import './GamePage.css';

const TURN_DURATION = 30;
const WORDS_PER_TURN = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function GamePage({ config, onEnd }) {
  const [teams, setTeams] = useState(config.teams);
  const [wordPool, setWordPool] = useState(null);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [currentWords, setCurrentWords] = useState([]);
  const [guessed, setGuessed] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);
  const [roundScore, setRoundScore] = useState(0);
  const [roundWords, setRoundWords] = useState([]);
  const [roundGuessedIds, setRoundGuessedIds] = useState(new Set());
  const [gameOverReason, setGameOverReason] = useState('');
  const [loadError, setLoadError] = useState('');

  // Refs so timer callbacks always see latest values without stale closures
  const guessedRef = useRef(new Set());
  const currentWordsRef = useRef([]);
  const remainingPoolRef = useRef([]);
  const timerRef = useRef(null);
  const currentTeamIdxRef = useRef(0);

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(words => {
        if (words.length === 0) {
          setLoadError('Er zijn geen begrippen in de lijst. Voeg eerst begrippen toe via "Beheer begrippen".');
          setPhase('error');
        } else {
          setWordPool(shuffle(words));
          setPhase('waiting');
        }
      })
      .catch(() => {
        setLoadError('Kon de begrippenlijst niet laden.');
        setPhase('error');
      });
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const finishTurn = useCallback((finalGuessed, finalPool) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const score = finalGuessed.size;
    const wordsThisRound = [...currentWordsRef.current];

    setRoundScore(score);
    setRoundWords(wordsThisRound);
    setRoundGuessedIds(new Set(finalGuessed));
    setWordPool(finalPool);

    const teamIdx = currentTeamIdxRef.current;
    setTeams(prev => {
      const next = prev.map((t, i) =>
        i === teamIdx ? { ...t, score: t.score + score } : t
      );
      const updatedScore = next[teamIdx].score;
      if (updatedScore >= config.targetScore) {
        setGameOverReason(`${next[teamIdx].name} heeft ${config.targetScore} punten bereikt!`);
        setPhase('gameOver');
      } else if (finalPool.length === 0) {
        setGameOverReason('Alle begrippen zijn gebruikt!');
        setPhase('gameOver');
      } else {
        setPhase('roundEnd');
      }
      return next;
    });
  }, [config.targetScore]);

  function startTurn(pool) {
    const activePool = pool ?? wordPool;
    if (!activePool || activePool.length === 0) {
      setGameOverReason('Alle begrippen zijn gebruikt!');
      setPhase('gameOver');
      return;
    }

    const words = activePool.slice(0, WORDS_PER_TURN);
    const remaining = activePool.slice(WORDS_PER_TURN);

    currentWordsRef.current = words;
    remainingPoolRef.current = remaining;
    guessedRef.current = new Set();

    setCurrentWords(words);
    setGuessed(new Set());
    setTimeLeft(TURN_DURATION);
    setPhase('playing');

    let t = TURN_DURATION;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        const unguessed = currentWordsRef.current.filter(w => !guessedRef.current.has(w.id));
        finishTurn(guessedRef.current, [...unguessed, ...remainingPoolRef.current]);
      }
    }, 1000);
  }

  function handleGuess(wordId) {
    const next = new Set(guessedRef.current);
    if (next.has(wordId)) next.delete(wordId);
    else next.add(wordId);
    guessedRef.current = next;
    setGuessed(new Set(next));

    if (next.size === currentWordsRef.current.length) {
      const unguessed = currentWordsRef.current.filter(w => !next.has(w.id));
      finishTurn(next, [...unguessed, ...remainingPoolRef.current]);
    }
  }

  function nextTurn() {
    // Advance the playerIndex of the team that just finished their turn
    const playedTeamIdx = currentTeamIdxRef.current;
    const nextTeamIdx = (playedTeamIdx + 1) % teams.length;
    currentTeamIdxRef.current = nextTeamIdx;

    setCurrentTeamIdx(nextTeamIdx);
    setTeams(prev => prev.map((t, i) =>
      i === playedTeamIdx
        ? { ...t, playerIndex: (t.playerIndex + 1) % t.members.length }
        : t
    ));
    setPhase('waiting');
  }

  const currentTeam = teams[currentTeamIdx];
  const currentPlayer = currentTeam?.members[currentTeam?.playerIndex ?? 0];
  const teamColor = TEAM_COLORS[currentTeamIdx];

  if (phase === 'loading') {
    return <div className="game-page page text-center"><p className="text-muted">Begrippen laden...</p></div>;
  }

  if (phase === 'error') {
    return (
      <div className="game-page page text-center">
        <div className="error-msg">{loadError}</div>
        <button className="btn-secondary mt-md" onClick={onEnd}>Terug naar setup</button>
      </div>
    );
  }

  if (phase === 'gameOver') {
    const winner = [...teams].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="game-page page">
        <div className="gameover-card card text-center">
          <div className="gameover-icon">🏆</div>
          <h1>Spel voorbij!</h1>
          <p className="text-muted mt-sm">{gameOverReason}</p>
          <div className="winner-banner mt-md" style={{ borderColor: TEAM_COLORS[teams.indexOf(winner)] }}>
            <span className="text-muted text-sm">Winnaar</span>
            <h2 style={{ color: TEAM_COLORS[teams.indexOf(winner)] }}>{winner.name}</h2>
            <span className="text-xl font-bold">{winner.score} punten</span>
          </div>
          <div className="final-scores mt-md">
            {[...teams].sort((a, b) => b.score - a.score).map((t, i) => (
              <div key={t.name} className="final-score-row" style={{ borderLeftColor: TEAM_COLORS[teams.indexOf(t)] }}>
                <span className="font-bold">{i + 1}. {t.name}</span>
                <span className="font-bold">{t.score} pt</span>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-lg" onClick={onEnd}>Nieuw spel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="score-bar">
        {teams.map((t, i) => (
          <div key={t.name} className="score-item" style={{ borderBottomColor: TEAM_COLORS[i] }}>
            <span className="score-name">{t.name}</span>
            <span className="score-val">{t.score}</span>
          </div>
        ))}
        <div className="score-target">
          <span className="score-name">Doel</span>
          <span className="score-val">{config.targetScore}</span>
        </div>
      </div>

      <div className="game-content page">
        {phase === 'waiting' && (
          <div className="waiting-card card text-center">
            <div className="turn-badge" style={{ background: teamColor }}>{currentTeam.name}</div>
            <h2 className="mt-md">Beurt van:</h2>
            <div className="player-name">{currentPlayer}</div>
            <p className="text-muted mt-sm">
              Klik op Start als je klaar bent. Je hebt {TURN_DURATION} seconden om zo veel mogelijk begrippen te omschrijven.
            </p>
            <p className="text-muted text-sm mt-sm">Begrippen over: {wordPool?.length ?? 0}</p>
            <button className="btn-start mt-lg" style={{ background: teamColor }} onClick={() => startTurn()}>
              Start
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div className="playing-view">
            <div className="timer-row flex items-center justify-between mb-md">
              <div className="turn-badge-sm" style={{ background: teamColor }}>
                {currentTeam.name} — {currentPlayer}
              </div>
              <div className={`timer ${timeLeft <= 10 ? 'timer-urgent' : ''}`}>{timeLeft}s</div>
            </div>
            <div className="words-grid">
              {currentWords.map(word => (
                <button
                  key={word.id}
                  className={`word-card ${guessed.has(word.id) ? 'word-guessed' : ''}`}
                  onClick={() => handleGuess(word.id)}
                >
                  {guessed.has(word.id) && <span className="check-icon">✓</span>}
                  <span className={guessed.has(word.id) ? 'word-done' : ''}>{word.text}</span>
                </button>
              ))}
            </div>
            <p className="text-muted text-sm text-center mt-md">Klik op een begrip als het geraden is</p>
          </div>
        )}

        {phase === 'roundEnd' && (
          <div className="round-end-card card text-center">
            <div className="turn-badge" style={{ background: teamColor }}>{currentTeam.name}</div>
            <h2 className="mt-md">Beurt voorbij!</h2>
            <div className="round-score mt-md">
              <span className="round-score-num">{roundScore}</span>
              <span className="text-muted"> punt{roundScore !== 1 ? 'en' : ''}</span>
            </div>

            <div className="round-words mt-md">
              {roundWords.map(w => (
                <div
                  key={w.id}
                  className={`round-word-row ${roundGuessedIds.has(w.id) ? 'round-word-hit' : 'round-word-miss'}`}
                >
                  <span className="round-word-icon">{roundGuessedIds.has(w.id) ? '✓' : '✗'}</span>
                  <span>{w.text}</span>
                </div>
              ))}
            </div>

            <p className="text-muted mt-md">
              Totaal {currentTeam.name}: <strong>{currentTeam.score}</strong> punten
            </p>
            <p className="text-muted text-sm mt-sm">Begrippen over: {wordPool?.length ?? 0}</p>
            <button className="btn-primary mt-lg" onClick={nextTurn}>Volgende beurt</button>
          </div>
        )}
      </div>
    </div>
  );
}
