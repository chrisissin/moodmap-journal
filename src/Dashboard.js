import React, { useState, useEffect } from 'react';
import { loadMetrics, defaultCategories } from './data';

// Helper: list all dates between two dates (inclusive)
function getDatesInRange(start, end) {
  const dates = [];
  const curr = new Date(start);
  const last = new Date(end);
  while (curr <= last) {
    dates.push(curr.toISOString().slice(0,10));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  useEffect(() => {
    setMetrics(loadMetrics());
  }, []);

  // Date range selection (last 7 days default)
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0,10);
  const defaultStart = new Date(today.getTime() - 6*24*60*60*1000)
                          .toISOString().slice(0,10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate]     = useState(defaultEnd);

  // Gather dates in range
  const dates = getDatesInRange(startDate, endDate);

  // Category Distribution Data (aggregate counts over range)
  const catCounts = {};
  dates.forEach(d => {
    const c = metrics[d]?.catCounts || {};
    Object.entries(c).forEach(([cid, cnt]) => {
      catCounts[cid] = (catCounts[cid] || 0) + cnt;
    });
  });
  // Sort categories if desired (or keep default order)
  const sortedCats = Object.keys(catCounts);

  // Mood timeline: average rating per day
  const timeline = dates.map(d => {
    const m = metrics[d];
    return m ? m.avgRating : null;
  });

  return (
    <div>
      <h3>Dashboard</h3>
      <div style={{ marginBottom: 16 }}>
        <label>From </label>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <label style={{ marginLeft: 12 }}>To </label>
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <b>Category Distribution ({startDate}–{endDate})</b>
          <div>
            {sortedCats.map(cid => {
              const icon = defaultCategories.find(c=>c.id===cid)?.icon || '';
              const name = defaultCategories.find(c=>c.id===cid)?.name || cid;
              const cnt = catCounts[cid] || 0;
              return <div key={cid}>{icon} {name}: {cnt}</div>;
            })}
          </div>
        </div>
        <div>
          <b>Mood Timeline (Avg Rating)</b>
          <div>
            {dates.map((d,i) => (
              <div key={d}>{d}: {timeline[i] !== null ? timeline[i] + '★' : '—'}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Table */}
      <div style={{ marginTop: 32, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Total</th>
              {defaultCategories.map(cat => (
                <th key={cat.id} style={thStyle}>{cat.icon}</th>
              ))}
            </tr>
            <tr>
              <th style={thStyle}>Category</th>
              {defaultCategories.map(cat => (
                <th key={cat.id} style={thStyle}>{cat.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Totals row */}
            <tr>
              <td style={tdStyle}>Totals</td>
              {defaultCategories.map(cat => (
                <td key={cat.id} style={tdStyle}>{catCounts[cat.id] || 0}</td>
              ))}
            </tr>
            {/* One row per date */}
            {dates.map(d => (
              <tr key={d} style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>{d}</td>
                {defaultCategories.map(cat => (
                  <td key={cat.id} style={tdStyle}>{metrics[d]?.catCounts[cat.id] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple cell styles
const thStyle = { border: '1px solid #ccc', padding: 6, background: '#eee' };
const tdStyle = { border: '1px solid #ccc', padding: 6 };