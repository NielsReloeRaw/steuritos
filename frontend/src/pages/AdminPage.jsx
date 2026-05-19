import { useState, useEffect } from 'react';
import './AdminPage.css';

export default function AdminPage({ onBack }) {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    fetch('/api/words')
      .then(r => r.json())
      .then(w => { setWords(w); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function addWord(e) {
    e.preventDefault();
    if (!newWord.trim()) return;
    setSaving(true);
    const res = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: newWord }),
    });
    const added = await res.json();
    setWords(prev => [...prev, added]);
    setNewWord('');
    setSaving(false);
  }

  async function deleteWord(id) {
    await fetch(`/api/words/${id}`, { method: 'DELETE' });
    setWords(prev => prev.filter(w => w.id !== id));
  }

  async function bulkAdd() {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setSaving(true);
    const res = await fetch('/api/words/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words: lines }),
    });
    const added = await res.json();
    setWords(prev => [...prev, ...added]);
    setBulkText('');
    setShowBulk(false);
    setSaving(false);
  }

  async function clearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    await fetch('/api/words', { method: 'DELETE' });
    setWords([]);
    setConfirmClear(false);
  }

  const filtered = words.filter(w => w.text.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page page">
      <div className="flex justify-between items-center mb-md">
        <h1>Beheer begrippen</h1>
        <button className="btn-secondary" onClick={onBack}>← Terug</button>
      </div>

      <div className="stats-row flex gap-md mb-md">
        <div className="stat-card card">
          <span className="stat-num">{words.length}</span>
          <span className="text-muted text-sm">begrippen totaal</span>
        </div>
      </div>

      <div className="card mb-md">
        <h3 className="mb-md">Begrip toevoegen</h3>
        <form onSubmit={addWord} className="flex gap-sm">
          <input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            placeholder="Nieuw begrip..."
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={saving || !newWord.trim()}>
            Toevoegen
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowBulk(v => !v)}
          >
            Bulk
          </button>
        </form>

        {showBulk && (
          <div className="bulk-section mt-md">
            <p className="text-muted text-sm mb-md">Eén begrip per regel:</p>
            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'Begrip 1\nBegrip 2\nBegrip 3'}
              rows={8}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <div className="flex gap-sm mt-sm">
              <button className="btn-primary" onClick={bulkAdd} disabled={saving || !bulkText.trim()}>
                {bulkText.split('\n').filter(l => l.trim()).length} begrippen toevoegen
              </button>
              <button className="btn-secondary" onClick={() => setShowBulk(false)}>Annuleren</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-md">
          <h3>Begrippenlijst ({filtered.length}{search ? ` van ${words.length}` : ''})</h3>
          <button
            className={confirmClear ? 'btn-danger' : 'btn-secondary'}
            onClick={clearAll}
            disabled={words.length === 0}
          >
            {confirmClear ? 'Zeker weten?' : 'Alles verwijderen'}
          </button>
        </div>

        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setConfirmClear(false); }}
          placeholder="Zoeken..."
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        {loading ? (
          <p className="text-muted">Laden...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">
            {words.length === 0 ? 'Nog geen begrippen toegevoegd.' : 'Geen resultaten.'}
          </p>
        ) : (
          <div className="words-list">
            {filtered.map(w => (
              <div key={w.id} className="word-row flex justify-between items-center">
                <span>{w.text}</span>
                <button className="btn-danger icon-btn" onClick={() => deleteWord(w.id)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
