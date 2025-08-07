import React, { useState, useEffect } from 'react';
import { loadMetrics, saveMetrics, defaultCategories } from './data';

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
  // Load metrics into state
  const [metrics, setMetrics] = useState({});
  useEffect(() => {
    setMetrics(loadMetrics());
  }, []);

  // Date-range picker (defaults to last 7 days)
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0,10);
  const defaultStart = new Date(today.getTime() - 6*86400000)
                        .toISOString().slice(0,10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate]     = useState(defaultEnd);

  // Compute the list of dates to display
  const dates = getDatesInRange(startDate, endDate);

  // Build aggregated counts for category distribution
  const catCounts = {};
  dates.forEach(d => {
    const day = metrics[d]?.catCounts || {};
    Object.entries(day).forEach(([cid, cnt]) => {
      catCounts[cid] = (catCounts[cid] || 0) + cnt;
    });
  });

  // The full list of category IDs (in display order)
  const catIds = defaultCategories.map(c => c.id);

  // Totals row (sum over the range)
  const totals = catIds.map(cid =>
    dates.reduce((sum, d) => sum + (metrics[d]?.catCounts[cid] || 0), 0)
  );

  // Mood timeline (average rating per day)
  const timeline = dates.map(d =>
    metrics[d]?.avgRating ?? null
  );

  // Handler: update a single cell and persist
  function updateMetric(date, catId, value) {
    const dayMetrics = metrics[date] || { catCounts: {}, avgRating: metrics[date]?.avgRating || 0 };
    const newCatCounts = { ...dayMetrics.catCounts, [catId]: Number(value) };
    const newMetrics = {
      ...metrics,
      [date]: { ...dayMetrics, catCounts: newCatCounts }
    };
    saveMetrics(newMetrics);
    setMetrics(newMetrics);
  }

  return (
    <div>
      <h3>Dashboard</h3>
      <div style={{ marginBottom: 16 }}>
        <label>From&nbsp;
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        <label style={{ marginLeft: 12 }}>To&nbsp;
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <b>Category Distribution ({startDate}–{endDate})</b>
          <div style={{ marginTop: 8 }}>
            {catIds.map(cid => {
              const cat = defaultCategories.find(c => c.id === cid);
              return (
                <div key={cid}>
                  {cat.icon} {cat.name}: {catCounts[cid] || 0}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <b>Mood Timeline (Avg Rating)</b>
          <div style={{ marginTop: 8 }}>
            {dates.map((d,i) => (
              <div key={d}>
                {d}: {timeline[i] !== null ? timeline[i] + '★' : '—'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Metrics Table */}
      <div style={{ marginTop: 32, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Total</th>
              {catIds.map(cid => (
                <th key={cid} style={thStyle}>
                  {defaultCategories.find(c => c.id === cid)?.icon}
                </th>
              ))}
            </tr>
            <tr>
              <th style={thStyle}>Category</th>
              {catIds.map(cid => (
                <th key={cid} style={thStyle}>
                  {defaultCategories.find(c => c.id === cid)?.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Totals</td>
              {totals.map((t, i) => (
                <td key={i} style={tdStyle}>{t}</td>
              ))}
            </tr>
            {dates.map(d => (
              <tr key={d} style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>{d}</td>
                {catIds.map(cid => (
                  <td key={cid} style={tdStyle}>
                    <input
                      type="number"
                      min={0}
                      value={metrics[d]?.catCounts[cid] || 0}
                      style={{ width: '3em' }}
                      onChange={e => updateMetric(d, cid, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Cell styles
const thStyle = {
  border: '1px solid #ccc',
  padding: 6,
  background: '#eee',
  textAlign: 'center'
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: 6,
  textAlign: 'center'
};
