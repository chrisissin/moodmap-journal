import React, { useState, useEffect } from 'react';
import { loadData, saveData, defaultCategories, defaultPurposes, saveAllMetrics } from './data';

// Keywords for auto-tagging
const categoryKeywords = {
  work: ['work', 'job', 'task', 'admin'],
  learn: ['learn', 'study', 'practice'],
  play: ['play', 'fun', 'game'],
  family: ['family', 'parents', 'mom', 'dad'],
  grateful: ['grateful', 'thank', '+'],
  ego: ['ego', 'regret', 'criticism'],
  connect: ['connect', 'help', 'support', 'value'],
  exercise: ['run', 'bike', 'gym', 'exercise', 'walk', 'hike'],
  errand: ['errand', 'shop', 'buy', 'purchase'],
  create: ['create', 'make', 'build', 'write'],
  career: ['career', 'role', 'promotion'],
  class: ['class', 'course', 'lesson'],
  kids: ['kid', 'kids', 'child', 'children', 'nana', 'ray', 'casper'],
  bow: ['bow', 'bowen'],
  parent: ['parent', 'parents'],
  friend: ['friend', 'friends', 'buddy', 'pal'],
  volunteer: ['volunteer', 'service','scout'],
  commute: ['commute', 'drive', 'bus', 'train'],
  mindful: ['mindful', 'meditate', 'meditation'],
  meal: ['meal', 'eat', 'dinner', 'lunch', 'breakfast', 'juice'],
  media: ['media', 'tv', 'video', 'podcast'],
  money: ['money', 'finance', 'budget', 'pay','bookkeep','banking'],
  read: ['read', 'book', 'article']
};

export default function DayView() {
  const [data, setData] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [showEditor, setShowEditor] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  function saveAll(newData) {
    setData(newData);
    saveData(newData);
    saveAllMetrics(newData);
  }

  function startEdit(hour, event = null) {
    setEditEvent(
      event ? { ...event } : { hour, note: '', rating: 3, categories: [], purposes: [], context: {} }
    );
    setShowEditor(true);
  }

  function saveEvent(ev) {
    const text = ev.note || '';
    const tags = ev.categories ? [...ev.categories] : [];
    // escape regex chars
    const escapeReg = s => s.replace(/[.*+?^${}()|[\]\\]/g, m => `\\${m}`);
    // auto-tag categories
    defaultCategories.forEach(cat => {
      if (!tags.includes(cat.id)) {
        (categoryKeywords[cat.id] || [cat.id]).forEach(kw => {
          let matched = false;
          if (/\w/.test(kw)) {
            const pattern = `\\b${escapeReg(kw)}\\b`;
            if (new RegExp(pattern, 'i').test(text)) matched = true;
          } else {
            if (text.includes(kw)) matched = true;
          }
          if (matched) tags.push(cat.id);
        });
      }
    });
    ev.categories = Array.from(new Set(tags));

    const day = data[date] ? [...data[date]] : [];
    if (ev.id) {
      const idx = day.findIndex(e => e.id === ev.id);
      if (idx !== -1) day[idx] = ev;
    } else {
      ev.id = Math.random().toString(36).slice(2);
      day.push(ev);
    }
    saveAll({ ...data, [date]: day });
    setShowEditor(false);
  }

  function deleteEvent(ev) {
    const day = data[date] ? data[date].filter(e => e.id !== ev.id) : [];
    saveAll({ ...data, [date]: day });
    setShowEditor(false);
  }

  const eventsByHour = Array.from({ length: 24 }, (_, h) => (data[date] || []).filter(ev => +ev.hour === h));

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={() => startEdit(null)}>+ Add Event</button>
      </div>
      <div>
        {eventsByHour.map((events, hour) => (
          <div key={hour} style={{ borderBottom: '1px solid #ddd', marginBottom: 6 }}>
            <b style={{ width: 50, display: 'inline-block' }}>{String(hour).padStart(2,'0')}:00</b>
            {events.length === 0 && <button style={{ fontSize: 11, marginLeft: 6 }} onClick={() => startEdit(hour)}>+ Add</button>}
            {events.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', padding: '2px 0', cursor: 'pointer' }} onClick={() => startEdit(ev.hour, ev)}>
                <span style={{ width: 36 }}>{ev.rating}★</span>
                <span style={{ flex: 1, fontSize: 12 }}>{ev.note}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {ev.categories.map(cid => defaultCategories.find(c => c.id === cid)?.icon)}
                  {Object.entries(ev.context || {}).map(([k, v]) => v && contextIcon(k))}
                  {ev.purposes.map(pid => defaultPurposes.find(p => p.id === pid)?.icon)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {showEditor && <EventEditor event={editEvent} onSave={saveEvent} onCancel={() => setShowEditor(false)} onDelete={deleteEvent} />}
    </div>
  );
}

function contextIcon(type) {
  switch (type) {
    case 'weather': return '☀️';
    case 'location': return '📍';
    case 'movement': return '🏃';
    default: return '🔹';
  }
}

function EventEditor({ event, onSave, onCancel, onDelete }) {
  const [note, setNote] = useState(event.note);
  const [rating, setRating] = useState(event.rating);
  const [categories, setCategories] = useState(event.categories || []);
  const [purposes, setPurposes] = useState(event.purposes || []);
  const [context, setContext] = useState(event.context || {});
  const hour = event.hour;

  return (
    <div style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', padding: 16, borderRadius: 8 }}>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <b>{hour != null ? `${String(hour).padStart(2,'0')}:00` : 'New'} Event</b>
        <button onClick={onCancel}>✕</button>
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Note..." style={{ width: '100%', margin: '8px 0' }} />
      <div>
        <label>Rating:&nbsp;<select value={rating} onChange={e => setRating(+e.target.value)}>{[1,2,3,4,5].map(i => <option key={i} value={i}>{i}★</option>)}</select></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <strong>Categories:</strong>&nbsp;{defaultCategories.map(cat => <label key={cat.id} style={{ marginRight: 8 }}><input type="checkbox" checked={categories.includes(cat.id)} onChange={e => setCategories(e.target.checked ? [...categories, cat.id] : categories.filter(id => id !== cat.id))} />{' '}{cat.icon} {cat.name}</label>)}
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSave({ ...event, note, rating, categories, purposes, context })}>Save</button>
        {event.id && <button onClick={() => onDelete(event)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>}
      </div>
    </div>
  );
}
