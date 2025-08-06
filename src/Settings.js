import React, { useState } from 'react';
import {
  loadData,
  saveData,
  defaultCategories,
  defaultPurposes,
  saveAllMetrics,
  loadMetrics
} from './data';

// Preprocess: Insert ---PM--- marker
function insertPMMarker(rawText) {
  const lines = rawText.split('\n');
  let result = [];
  let found12 = false;
  for (let line of lines) {
    const t = line.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(t)) {
      found12 = false;
      result.push(line);
    } else if (!found12 && /^12(?:[-–]\d{1,2})?$/.test(t)) {
      found12 = true;
      result.push(line, '---PM---');
    } else {
      result.push(line);
    }
  }
  return result.join('\n');
}

// Parser: Import from custom log format (placeholder)
function importFromLogFormat(text, existing = {}) {
  // TODO: implement parser logic
  return existing;
}

export default function Settings() {
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  // Text import handler
  function handleImportText() {
    try {
      const pre = insertPMMarker(importText);
      const parsed = importFromLogFormat(pre, loadData());
      const existing = loadData();
      const merged = { ...existing, ...parsed };
      saveData(merged);
      saveAllMetrics(merged);
      setImportMsg('Text import successful!');
    } catch (e) {
      setImportMsg('Import failed: ' + e.message);
    }
  }

  // JSON import handler
  function handleJSONImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const json = JSON.parse(evt.target.result);
        if (typeof json !== 'object' || Array.isArray(json)) {
          throw new Error('JSON must be an object of { date: events[] }');
        }
        const existing = loadData();
        const merged = { ...existing };
        // Deep merge: append non-duplicate events by id
        Object.entries(json).forEach(([date, events]) => {
          if (!Array.isArray(events)) return;
          merged[date] = merged[date] || [];
          events.forEach(ev => {
            if (!merged[date].some(e => e.id === ev.id)) {
              merged[date].push(ev);
            }
          });
        });
        saveData(merged);
        saveAllMetrics(merged);
        setImportMsg('JSON import successful! Reloading...');
        setTimeout(() => window.location.reload(), 500);
      } catch (err) {
        setImportMsg('JSON import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // Export application JSON
  function handleExportJSON() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export daily metrics as CSV
  function exportMetricsCSV() {
    const m = loadMetrics();
    const dates = Object.keys(m).sort();
    const catIds = defaultCategories.map(c => c.id);
    const rows = [['date', ...catIds, 'avgRating']];
    dates.forEach(d => {
      const { catCounts, avgRating } = m[d] || { catCounts: {}, avgRating: 0 };
      rows.push([d, ...catIds.map(id => catCounts[id] || 0), avgRating]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily-metrics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h3>Settings</h3>
      <section>
        <h4>Categories</h4>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {defaultCategories.map(cat => (
            <div key={cat.id} style={{ display:'flex', gap:4, alignItems:'center' }}>
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
        </div>
        <h4>Purposes</h4>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          {defaultPurposes.map(pur => (
            <div key={pur.id} style={{ display:'flex', gap:4, alignItems:'center' }}>
              <span>{pur.icon}</span>
              <span>{pur.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop:24 }}>
        <h4>Import from Text</h4>
        <textarea
          rows={6}
          cols={60}
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder="Paste your log text here"
        />
        <div><button onClick={handleImportText}>Import Text</button></div>
        <div style={{ marginTop:8, color: importMsg.startsWith('Import failed') ? 'red' : 'green' }}>
          {importMsg}
        </div>
      </section>

      <section style={{ marginTop:24 }}>
        <h4>Import from JSON</h4>
        <input type="file" accept="application/json" onChange={handleJSONImport} />
        <div style={{ marginTop:8, color: importMsg.startsWith('Import failed') ? 'red' : 'green' }}>
          {importMsg}
        </div>
      </section>

      <section style={{ marginTop:24 }}>
        <button onClick={handleExportJSON}>Export Events as JSON</button>
      </section>

      <section style={{ marginTop:24 }}>
        <button onClick={exportMetricsCSV}>Export Daily Metrics CSV</button>
      </section>
    </div>
  );
}
