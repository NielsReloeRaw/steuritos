const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const WORDS_FILE = path.join(DATA_DIR, 'words.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(WORDS_FILE)) fs.writeFileSync(WORDS_FILE, '[]');
}

function loadWords() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(WORDS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveWords(words) {
  ensureDataDir();
  fs.writeFileSync(WORDS_FILE, JSON.stringify(words, null, 2));
}

app.get('/api/words', (req, res) => {
  res.json(loadWords());
});

app.post('/api/words', (req, res) => {
  const { word } = req.body;
  if (!word || !word.trim()) return res.status(400).json({ error: 'Begrip is verplicht' });
  const words = loadWords();
  const newWord = { id: Date.now(), text: word.trim() };
  words.push(newWord);
  saveWords(words);
  res.json(newWord);
});

app.post('/api/words/bulk', (req, res) => {
  const { words: newWords } = req.body;
  if (!Array.isArray(newWords)) return res.status(400).json({ error: 'Ongeldige invoer' });
  const words = loadWords();
  const added = [];
  for (const text of newWords) {
    if (text && text.trim()) {
      const w = { id: Date.now() + Math.random(), text: text.trim() };
      words.push(w);
      added.push(w);
    }
  }
  saveWords(words);
  res.json(added);
});

app.delete('/api/words/:id', (req, res) => {
  let words = loadWords();
  words = words.filter(w => String(w.id) !== req.params.id);
  saveWords(words);
  res.json({ ok: true });
});

app.delete('/api/words', (req, res) => {
  saveWords([]);
  res.json({ ok: true });
});

// Serve built frontend
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
app.get('*', (req, res) => {
  const indexFile = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Frontend niet gevonden. Bouw eerst de frontend.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Steuritos draait op poort ${PORT}`));
