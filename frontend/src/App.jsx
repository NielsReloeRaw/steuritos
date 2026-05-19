import { useState } from 'react';
import SetupPage from './pages/SetupPage.jsx';
import GamePage from './pages/GamePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  const [page, setPage] = useState('setup');
  const [gameConfig, setGameConfig] = useState(null);

  function startGame(config) {
    setGameConfig(config);
    setPage('game');
  }

  if (page === 'admin') return <AdminPage onBack={() => setPage('setup')} />;
  if (page === 'game') return <GamePage config={gameConfig} onEnd={() => setPage('setup')} />;
  return <SetupPage onStart={startGame} onAdmin={() => setPage('admin')} />;
}
