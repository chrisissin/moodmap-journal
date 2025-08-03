import React, { useState } from 'react';
import DayView from './DayView';
import Dashboard from './Dashboard';
import Settings from './Settings';

// Main app nav
export default function App() {
  const [page, setPage] = useState('day');
  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setPage('day')}>Day View</button>
        <button onClick={() => setPage('dashboard')}>Dashboard</button>
        <button onClick={() => setPage('settings')}>Settings</button>
      </nav>
      <main>
        {page === 'day' && <DayView />}
        {page === 'dashboard' && <Dashboard />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
