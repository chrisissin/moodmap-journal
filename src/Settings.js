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

// Parser: Import from custom log format
 function importFromLogFormat(text, existingData = {}) {
   const dateLine  = /^(\d{2})\/(\d{2})\/(\d{4})$/;
   const hourLine  = /^(\d{1,2})(?:[-–](\d{1,2}))?$/;
   const pmMarker  = /^---\s*PM\s*---$/i;

   let currentDate = null;
   let currentHour = null;
   let isPM        = false;
   let results     = { ...existingData };
   let imported    = 0;

   for (const rawLine of text.split('\n')) {
     const line = rawLine.trim();
     if (!line) continue;
     if (pmMarker.test(line)) {
       isPM = true;
       continue;
     }
     let match;
     // Date header (MM/DD/YYYY)
     if ((match = dateLine.exec(line))) {
       const [_, mm, dd, yyyy] = match;
       currentDate = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
       results[currentDate] = results[currentDate] || [];
       isPM = false;
     }
     // Hour block
     else if ((match = hourLine.exec(line))) {
       let h = parseInt(match[1], 10);
       if (isPM && h !== 12) h += 12;
       currentHour = h;
     }
     // Note line
     else if (currentDate != null && currentHour != null) {
       let note = line;
       // auto‐detect purposes
       const purposes = [];
       if (/\bgrateful\b/i.test(note)) purposes.push('meaning');
       if (/\bhappy\b/i.test(note))    purposes.push('happy');
       if (/\badventure/i.test(note))  purposes.push('adventure');

       // auto‐detect categories (same list you use elsewhere)
       const categories = [];
       if (/\b(learn|class)\b/i.test(note))          categories.push('learn');
       if (/\bwork\b/i.test(note))                   categories.push('work');
       if (/\b(run|bike|gym)\b/i.test(note))         categories.push('exercise');
       if (/\b(meditation|stretch|chill|nap)\b/i.test(note)) categories.push('mindful');
       if (/\bego\b/i.test(note))                    categories.push('ego');
       if (/\bgrateful\b/i.test(note))               categories.push('grateful');
       if (/\berrand\b/i.test(note))                 categories.push('errand');
       if (/\bcreate\b/i.test(note))                 categories.push('create');
       if (/\b(career|job)\b/i.test(note))           categories.push('career');
       if (/\b(kids|nana|casper|ray)\b/i.test(note)) categories.push('kids');
       if (/\bbow\b/i.test(note))                    categories.push('bow');
       if (/\bparent\b/i.test(note))                 categories.push('parent');
       if (/\bfriend\b/i.test(note))                 categories.push('friend');
       if (/\b(volunteer|scout)\b/i.test(note))      categories.push('volunteer');
       if (/\b(drive|commute)\b/i.test(note))        categories.push('commute');
       if (/\b(library|read)\b/i.test(note))         categories.push('read');
       if (/\b(tv|phone)\b/i.test(note))             categories.push('media');
       if (/\b(money|bookkeep)\b/i.test(note))       categories.push('money');
       if (/\b(lunch|breakfast|dinner)\b/i.test(note)) categories.push('meal');
       if (/\b(woke|sleep)\b/i.test(note))           categories.push('sleep');

       // rating heuristics
       let rating = 3;
       if (note.includes('+') || /grateful|happy|good/i.test(note)) rating = 5;
       else if (/regret|ego|bad|hurt/i.test(note))              rating = 2;
       if (/\s\+$/.test(note)) { rating = Math.min(5, rating+1); note = note.replace(/\s\+$/, '').trim(); }
       if (/\s-$/.test(note)) { rating = Math.max(1, rating-1); note = note.replace(/\s-$/, '').trim(); }

       // build and save event
       const event = {
         id: Math.random().toString(36).slice(2),
         hour: currentHour,
         note,
         rating,
         categories,
         purposes,
         context: {}
       };
       results[currentDate].push(event);
       imported++;
     }
   }
   if (!imported) throw new Error('No events found! Check log format.');
   return results;
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
