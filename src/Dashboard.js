// src/Dashboard.js

import React, { useState, useEffect } from 'react';
//import { loadMetrics, defaultCategories } from './data';
import { defaultCategories } from './data';
import { loadMetricsFromSheets, saveMetricsToSheets } from './sheets';

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
  const [editingCell, setEditingCell] = useState(null); // { date, catId }
  const [editValue, setEditValue] = useState('');

  // Load metrics on mount
  // useEffect(() => {
  //   setMetrics(loadMetrics());
  // }, []);
 useEffect(() => {
   (async () => {
     try {
       const m = await loadMetricsFromSheets();
       setMetrics(m || {});
     } catch (e) {
       console.error('Failed to load metrics from Sheets', e);
       setMetrics({});
     }
   })();
 }, []);

  // // Persist metrics back to localStorage and state
  // function saveMetrics(newMetrics) {
  //   setMetrics(newMetrics);
  //   localStorage.setItem('journalMetrics', JSON.stringify(newMetrics));
  // }
 async function saveMetrics(newMetrics) {
   setMetrics(newMetrics); // optimistic
   try {
     await saveMetricsToSheets(newMetrics);
   } catch (e) {
     console.error('Failed to save metrics to Sheets', e);
     // optionally show a toast and/or revert UI
   }
 }


  // Begin editing a cell
  function startEditCell(date, catId) {
    const current = metrics[date]?.catCounts?.[catId] || 0;
    setEditingCell({ date, catId });
    setEditValue(current.toString());
  }

  // Commit edit on blur or Enter
  function commitEdit() {
    if (!editingCell) return;
    const { date, catId } = editingCell;
    const num = parseInt(editValue, 10) || 0;
    const next = { ...metrics };
    if (!next[date]) next[date] = { catCounts: {}, avgRating: 0 };
    next[date].catCounts = { ...next[date].catCounts, [catId]: num };
    saveMetrics(next);
    setEditingCell(null);
  }

  // Date range (last 7 days default)
  const today       = new Date();
  const defaultEnd  = today.toISOString().slice(0,10);
  const defaultStart = new Date(today.getTime() - 6*24*60*60*1000)
                         .toISOString().slice(0,10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate]     = useState(defaultEnd);

  // Gather dates ascending and then sort descending for display
  const datesAsc = getDatesInRange(startDate, endDate);
  const dates    = datesAsc.slice().sort((a,b) => b.localeCompare(a));

  // Aggregate category counts over the range
  const catCounts = {};
  datesAsc.forEach(d => {
    const c = metrics[d]?.catCounts || {};
    Object.entries(c).forEach(([cid, cnt]) => {
      catCounts[cid] = (catCounts[cid] || 0) + cnt;
    });
  });

  // For display order, use defaultCategories array order
  const sortedCats = defaultCategories.map(c => c.id);

  // Compute mood timeline (not shown in table editing)
  const timeline = datesAsc.map(d => {
    const m = metrics[d];
    return m ? m.avgRating : null;
  });

  return (
    <div>
      <h3>Dashboard</h3>

      {/* Date Range Picker */}
      <div style={{ margin: '12px 0' }}>
        <label>
          From <input type="date" value={startDate}
                      onChange={e => setStartDate(e.target.value)} />
        </label>{' '}
        <label>
          To <input type="date" value={endDate}
                    onChange={e => setEndDate(e.target.value)} />
        </label>
      </div>

      {/* Editable Metrics Table */}
      <div style={{ marginTop: 32, overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Totals</th>
              {sortedCats.map(cid => (
                <th key={cid} style={thStyle}>
                  {defaultCategories.find(c => c.id === cid)?.icon}
                </th>
              ))}
            </tr>
            <tr>
              <th style={thStyle}>Category</th>
              {sortedCats.map(cid => (
                <th key={cid} style={thStyle}>
                  {defaultCategories.find(c => c.id === cid)?.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Totals row */}
            <tr>
              <td style={tdStyle}>Totals</td>
              {sortedCats.map(cid => (
                <td
                  key={cid}
                  style={tdStyle}
                  onClick={() => startEditCell('Totals', cid)}
                >
                  {editingCell?.date === 'Totals' && editingCell.catId === cid ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      autoFocus
                      style={{ width: '100%' }}
                    />
                  ) : (
                    catCounts[cid] || 0
                  )}
                </td>
              ))}
            </tr>

            {/* One row per date */}
            {dates.map(d => (
              <tr key={d} style={{ background: '#f9f9f9' }}>
                <td style={tdStyle}>{d}</td>
                {sortedCats.map(cid => (
                  <td
                    key={cid}
                    style={tdStyle}
                    onClick={() => startEditCell(d, cid)}
                  >
                    {editingCell?.date === d && editingCell.catId === cid ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        autoFocus
                        style={{ width: '100%' }}
                      />
                    ) : (
                      metrics[d]?.catCounts?.[cid] || 0
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Category Distribution & Mood Timeline */}
      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <b>Category Distribution ({startDate}–{endDate})</b>
          <div>
            {sortedCats.map(cid => {
              const cat = defaultCategories.find(c => c.id === cid);
              const cnt = catCounts[cid] || 0;
              return (
                <div key={cid}>
                  {cat?.icon} {cat?.name}: {cnt}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <b>Mood Timeline (Avg Rating)</b>
          <div>
            {datesAsc.map((d, i) => (
              <div key={d}>
                {d}: {timeline[i] !== null ? timeline[i] + '★' : '—'}
              </div>
            ))}
          </div>
        </div>
      </div>      
    </div>
  );
}

// Styles
const thStyle = {
  border: '1px solid #ccc',
  padding: 6,
  background: '#eee'
};
const tdStyle = {
  border: '1px solid #ccc',
  padding: 6,
  cursor: 'pointer'
};
