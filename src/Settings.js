import React, { useState } from 'react';
import { loadData, saveData, defaultCategories, defaultPurposes } from './data';

// Preprocess: Insert ---PM--- after first 12-xx hour block each day
function insertPMMarker(rawText) {
  const lines = rawText.split('\n');
  let resultLines = [];
  let found12 = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Date line resets everything
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(line)) {
      found12 = false;
      resultLines.push(lines[i]);
      continue;
    }
    // Look for hour blocks like "12-1" or "12"
    if (/^12(?:[-–]\d{1,2})?$/.test(line) && !found12) {
      found12 = true;
      resultLines.push(lines[i]);
      resultLines.push('---PM---');
      continue;
    }
    resultLines.push(lines[i]);
  }
  return resultLines.join('\n');
}

// Parser: Handles ---PM--- to set PM hours, and auto tags/ratings
function importFromLogFormat(text, existingData = {}) {
  const dateLine = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const hourLine = /^(\d{1,2})(?:[-–](\d{1,2}))?$/;
  const pmMarker = /^---\s*PM\s*---$/i;

  let currentDate = null;
  let currentHour = null;
  let isPM = false;
  let results = { ...existingData };
  let imported = 0;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (pmMarker.test(line)) {
      isPM = true;
      continue;
    }

    let match;
    if ((match = dateLine.exec(line))) {
      const [_, mm, dd, yyyy] = match;
      currentDate = `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
      if (!results[currentDate]) results[currentDate] = [];
      isPM = false;
    } else if ((match = hourLine.exec(line))) {
      let hour = parseInt(match[1], 10);
      if (isPM && hour !== 12) hour = hour + 12;
      currentHour = hour;
    } else if (currentDate && currentHour !== null) {
      let note = line;
      const purposes = [];
      if (/\bgrateful\b/i.test(note)) purposes.push('meaning');
      if (/\bhappy\b/i.test(note)) purposes.push('happy');
      if (/\badventure|adventurous\b/i.test(note)) purposes.push('adventure');
      const categories = [];
      if (/\b(learn|class)\b/i.test(note)) categories.push('learn');
      if (/\bwork\b/i.test(note)) categories.push('work');
      if (/\b(run|bike|gym)\b/i.test(note)) categories.push('exercise');
      if (/\b(meditation|stretch|chill|nap)\b/i.test(note)) categories.push('mindful');
      if (/\bego\b/i.test(note)) categories.push('ego');
      if (/\bgrateful\b/i.test(note)) categories.push('grateful');
      if (/\berrand\b/i.test(note)) categories.push('errand');
      if (/\bcreate\b/i.test(note)) categories.push('create');
      if (/\b(career|job)\b/i.test(note)) categories.push('career');
      if (/\bclass\b/i.test(note)) categories.push('class');
      if (/\b(kids|na|nana|casper|ray)\b/i.test(note)) categories.push('kids');
      if (/\bbow\b/i.test(note)) categories.push('bow');
      if (/\bparent\b/i.test(note)) categories.push('parent');
      if (/\bfriend\b/i.test(note)) categories.push('friend');
      if (/\b(volunteer|scout)\b/i.test(note)) categories.push('volunteer');
      if (/\b(drive|commute)\b/i.test(note)) categories.push('commute');
      if (/\b(library|read)\b/i.test(note)) categories.push('read');
      if (/\b(tv|phone)\b/i.test(note)) categories.push('media');
      if (/\b(money|bookkeep)\b/i.test(note)) categories.push('money');
      if (/\b(lunch|breakfast|dinner)\b/i.test(note)) categories.push('meal');
      if (/\b(woke|sleep)\b/i.test(note)) categories.push('sleep');
      let rating = 3;
      if (note.includes('+') || /grateful|happy|good/i.test(note)) rating = 5;
      else if (/regret|ego|bad|hurt/i.test(note)) rating = 2;
      if (/\s\+$/.test(note)) {
        rating = Math.min(5, rating + 1);
        note = note.replace(/\s\+$/, '').trim();
      } else if (/\s-$/.test(note)) {
        rating = Math.max(1, rating - 1);
        note = note.replace(/\s-$/, '').trim();
      }
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
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  function handleImport() {
    try {
      // 1. Preprocess and parse
      const preprocessed = insertPMMarker(importText);
      const importedData = importFromLogFormat(preprocessed, loadData());
  
      // 2. Load what’s already in storage
      const existing = loadData();
      const merged = { ...existing };
  
      // 3. For every date you parsed, merge in only truly new events
      Object.keys(importedData).forEach(date => {
        const dayImported = importedData[date];
        const dayExisting = existing[date] || [];
        // start with the old ones
        merged[date] = [...dayExisting];
        // add each imported event only if no existing event has same hour+note
        dayImported.forEach(ev => {
          const duplicate = dayExisting.some(e => e.hour === ev.hour && e.note === ev.note);
          if (!duplicate) {
            merged[date].push(ev);
          }
        });
      });
  
      // 4. Save and notify
      saveData(merged);
      setImportMsg("Import successful! New events merged.");
    } catch (e) {
      setImportMsg("Import failed: " + e.message);
    }
  }
  

  function handleExport() {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "journal-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h3>Settings</h3>
      <p>Categories:</p>
      <div>
        {defaultCategories.map(cat => <span key={cat.id} style={{ marginRight: 8 }}>{cat.icon} {cat.name}</span>)}
      </div>
      <p>Purposes:</p>
      <div>
        {defaultPurposes.map(pur => <span key={pur.id} style={{ marginRight: 8 }}>{pur.icon} {pur.name}</span>)}
      </div>
      <p><i>To edit categories/purposes, edit src/data.js for now (MVP)</i></p>
      <div style={{ marginTop: 24 }}>
        <b>Export/Import</b>
        <div>
          <button onClick={handleExport}>Export as JSON</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <textarea rows={6} cols={60}
            placeholder="Paste your existing log text here"
            value={importText}
            onChange={e => setImportText(e.target.value)}
          />
        </div>
        <button onClick={handleImport}>Import From Text</button>
        <div style={{ color: 'green', marginTop: 8 }}>{importMsg}</div>
      </div>
    </div>
  );
}
