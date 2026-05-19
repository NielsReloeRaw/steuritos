import { useState } from 'react';
import './SetupPage.css';

const SCORE_OPTIONS = [25, 50];

export default function SetupPage({ onStart, onAdmin }) {
  const [step, setStep] = useState(1);
  const [numTeams, setNumTeams] = useState(2);
  const [teams, setTeams] = useState([
    { name: 'Team 1', members: [''] },
    { name: 'Team 2', members: [''] },
  ]);
  const [targetScore, setTargetScore] = useState(25);
  const [customScore, setCustomScore] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState('');

  function handleNumTeamsChange(n) {
    setNumTeams(n);
    setTeams(prev => {
      const next = [...prev];
      while (next.length < n) next.push({ name: `Team ${next.length + 1}`, members: [''] });
      return next.slice(0, n);
    });
  }

  function updateTeamName(i, val) {
    setTeams(prev => prev.map((t, idx) => idx === i ? { ...t, name: val } : t));
  }

  function updateMember(teamIdx, memberIdx, val) {
    setTeams(prev => prev.map((t, i) => {
      if (i !== teamIdx) return t;
      const members = [...t.members];
      members[memberIdx] = val;
      return { ...t, members };
    }));
  }

  function addMember(teamIdx) {
    setTeams(prev => prev.map((t, i) =>
      i === teamIdx ? { ...t, members: [...t.members, ''] } : t
    ));
  }

  function removeMember(teamIdx, memberIdx) {
    setTeams(prev => prev.map((t, i) => {
      if (i !== teamIdx) return t;
      const members = t.members.filter((_, mi) => mi !== memberIdx);
      return { ...t, members: members.length ? members : [''] };
    }));
  }

  function validateStep1() {
    if (numTeams < 2) { setError('Minimaal 2 teams.'); return false; }
    setError('');
    return true;
  }

  function validateStep2() {
    for (const t of teams) {
      if (!t.name.trim()) { setError('Vul alle teamnamen in.'); return false; }
      if (t.members.filter(m => m.trim()).length === 0) {
        setError('Elk team heeft minimaal 1 speler nodig.'); return false;
      }
    }
    setError('');
    return true;
  }

  function handleStart() {
    const score = useCustom ? parseInt(customScore) : targetScore;
    if (!score || score < 1) { setError('Voer een geldig puntenaantal in.'); return; }
    onStart({
      teams: teams.map(t => ({
        name: t.name.trim(),
        members: t.members.filter(m => m.trim()).map(m => m.trim()),
        score: 0,
        playerIndex: 0,
      })),
      targetScore: score,
    });
  }

  return (
    <div className="setup-page page">
      <div className="setup-header flex justify-between items-center mb-md">
        <h1>Steuritos</h1>
        <button className="btn-secondary" onClick={onAdmin}>Beheer begrippen</button>
      </div>

      <div className="steps flex gap-sm mb-md">
        {['Teams', 'Spelers', 'Punten'].map((label, i) => (
          <div key={i} className={`step-indicator ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            <span className="step-num">{i + 1}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="error-box">{error}</div>}

      {step === 1 && (
        <div className="card">
          <h2 className="mb-md">Hoeveel teams doen er mee?</h2>
          <div className="num-teams-grid">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                className={numTeams === n ? 'btn-primary' : 'btn-secondary'}
                onClick={() => handleNumTeamsChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-muted text-sm mt-md">{numTeams} teams geselecteerd</p>
          <div className="step-actions mt-lg">
            <button className="btn-primary" onClick={() => { if (validateStep1()) setStep(2); }}>
              Volgende
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-md">Teamnamen en spelers</h2>
          <div className="teams-grid">
            {teams.map((team, ti) => (
              <div key={ti} className="card team-card">
                <div className="team-color-bar" style={{ background: TEAM_COLORS[ti] }} />
                <input
                  value={team.name}
                  onChange={e => updateTeamName(ti, e.target.value)}
                  placeholder={`Team ${ti + 1}`}
                  className="team-name-input"
                />
                <div className="members-list mt-sm">
                  {team.members.map((m, mi) => (
                    <div key={mi} className="member-row flex gap-sm items-center">
                      <input
                        value={m}
                        onChange={e => updateMember(ti, mi, e.target.value)}
                        placeholder={`Speler ${mi + 1}`}
                        style={{ flex: 1 }}
                      />
                      {team.members.length > 1 && (
                        <button className="btn-danger icon-btn" onClick={() => removeMember(ti, mi)}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="btn-secondary mt-sm" onClick={() => addMember(ti)}>
                  + Speler toevoegen
                </button>
              </div>
            ))}
          </div>
          <div className="step-actions mt-lg flex gap-sm">
            <button className="btn-secondary" onClick={() => setStep(1)}>Terug</button>
            <button className="btn-primary" onClick={() => { if (validateStep2()) setStep(3); }}>Volgende</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2 className="mb-md">Tot hoeveel punten wordt er gespeeld?</h2>
          <div className="score-options flex gap-md wrap">
            {SCORE_OPTIONS.map(s => (
              <button
                key={s}
                className={`score-btn ${!useCustom && targetScore === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setTargetScore(s); setUseCustom(false); }}
              >
                {s} punten
              </button>
            ))}
            <button
              className={`score-btn ${useCustom ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setUseCustom(true)}
            >
              Zelf invullen
            </button>
          </div>
          {useCustom && (
            <div className="mt-md flex gap-sm items-center">
              <input
                type="number"
                min="1"
                value={customScore}
                onChange={e => setCustomScore(e.target.value)}
                placeholder="Aantal punten"
                style={{ width: '150px' }}
              />
              <span className="text-muted">punten</span>
            </div>
          )}
          <div className="step-actions mt-lg flex gap-sm">
            <button className="btn-secondary" onClick={() => setStep(2)}>Terug</button>
            <button className="btn-success" onClick={handleStart}>Spel starten</button>
          </div>
        </div>
      )}
    </div>
  );
}

export const TEAM_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c',
];
