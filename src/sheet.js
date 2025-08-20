// src/sheets.js
const SHEETS_URL = process.env.REACT_APP_SHEETS_URL;   // set in .env
const SHEETS_SECRET = process.env.REACT_APP_SHEETS_SECRET;

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function loadMetricsFromSheets() {
  const url = `${SHEETS_URL}?action=metrics&secret=${encodeURIComponent(SHEETS_SECRET)}`;
  return getJSON(url); // -> { [date]: {catCounts:{}, avgRating} }
}

export async function loadEventsFromSheets() {
  const url = `${SHEETS_URL}?action=events&secret=${encodeURIComponent(SHEETS_SECRET)}`;
  return getJSON(url); // -> { [date]: [events] }
}

export async function saveMetricsToSheets(metricsObj) {
  const res = await fetch(SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveMetrics',
      secret: SHEETS_SECRET,
      metrics: metricsObj
    })
  });
  if (!res.ok) throw new Error(`Save metrics failed (${res.status})`);
  return res.json();
}

export async function saveEventsToSheets(eventsObj) {
  const res = await fetch(SHEETS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'saveEvents',
      secret: SHEETS_SECRET,
      events: eventsObj
    })
  });
  if (!res.ok) throw new Error(`Save events failed (${res.status})`);
  return res.json();
}
