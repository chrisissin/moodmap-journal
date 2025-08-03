import React, { useState, useEffect } from 'react';
import { loadData, saveData, defaultCategories, defaultPurposes } from './data';

export default function DayView() {
  const [data, setData] = useState({});
  const [date, setDate] = useState(() => (new Date()).toISOString().slice(0,10));
  const [showEditor, setShowEditor] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  function saveAll(newData) {
    setData(newData);
    saveData(newData);
  }

  function startEdit(hour, event = null) {
    setEditEvent(event ? { ...event } : { hour, note: '', rating: 3, categories: [], purposes: [], context: {} });
    setShowEditor(true);
  }
  function saveEvent(ev) {
    const day = data[date] ? [...data[date]] : [];
    if (ev.id) {
      const idx = day.findIndex(e => e.id === ev.id);
      if (idx !== -1) day[idx] = ev;
    } else {
      ev.id = Math.random().toString(36).slice(2);
      day.push(ev);
    }
    const newData = { ...data, [date]: day };
    saveAll(newData);
    setShowEditor(false);
  }
  function deleteEvent(ev) {
    const day = data[date] ? data[date].filter(e => e.id !== ev.id) : [];
    const newData = { ...data, [date]: day };
    saveAll(newData);
    setShowEditor(false);
  }

  const eventsByHour = Array.from({ length: 24 }, (_, h) => (data[date] || []).filter(ev => +ev.hour === h));

  return (
    <div>
      <div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button onClick={() => setShowEditor(true)}>+ Add Event</button>
      </div>
      <div>
        {eventsByHour.map((events, hour) => (
          <div key={hour} style={{ borderBottom: '1px solid #ddd', marginBottom: 6 }}>
            <b style={{ width: 46, display: 'inline-block' }}>{String(hour).padStart(2, '0')}:00</b>
            {events.length === 0 && (
              <button style={{ fontSize: 11, marginLeft: 6 }} onClick={() => startEdit(hour)}>+ Add</button>
            )}
            {events.map(ev => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', padding: '2px 0', cursor: 'pointer'
              }}
                onClick={() => startEdit(hour, ev)}
              >
                <span style={{ width: 32 }}>{ev.rating}★</span>
                <span style={{ width: 80, fontSize: 12 }}>{ev.note.slice(0, 10)}{ev.note.length > 10 ? '…' : ''}</span>
                <span>
                  {ev.categories.map(cid => defaultCategories.find(c => c.id === cid)?.icon)}
                  {Object.entries(ev.context || {}).map(([k, v]) => v && contextIcon(k))}
                  {ev.purposes.map(pid => defaultPurposes.find(p => p.id === pid)?.icon)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {showEditor && (
        <EventEditor
          event={editEvent}
          onSave={saveEvent}
          onCancel={() => setShowEditor(false)}
          onDelete={deleteEvent}
        />
      )}
    </div>
  );
}

function contextIcon(type) {
  return type === 'weather' ? '☀️' : type === 'location' ? '📍' : type === 'movement' ? '🏃' : '🔹';
}

function EventEditor({ event, onSave, onCancel, onDelete }) {
  const [note, setNote] = useState(event.note);
  const [rating, setRating] = useState(event.rating);
  const [categories, setCategories] = useState(event.categories || []);
  const [purposes, setPurposes] = useState(event.purposes || []);
  const [context, setContext] = useState(event.context || {});
  const hour = event.hour;

  return (
    <div style={{
      position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', background: '#fff',
      boxShadow: '0 2px 12px #0002', borderRadius: 10, padding: 18, zIndex: 100, minWidth: 340
    }}>
      <div>
        <b>{String(hour).padStart(2, '0')}:00 Event</b>
        <button style={{ float: 'right' }} onClick={onCancel}>✕</button>
      </div>
      <div style={{ marginTop: 8 }}>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note..." rows={2} style={{ width: '100%' }} />
      </div>
      <div>
        <label>Rating: </label>
        <select value={rating} onChange={e => setRating(+e.target.value)}>
          {[1,2,3,4,5].map(i => <option key={i} value={i}>{i}★</option>)}
        </select>
      </div>
      <div>
        <label>Categories: </label>
        {defaultCategories.map(cat =>
          <label key={cat.id} style={{ marginRight: 6 }}>
            <input type="checkbox" checked={categories.includes(cat.id)} onChange={e => {
              setCategories(e.target.checked
                ? [...categories, cat.id]
                : categories.filter(id => id !== cat.id));
            }} /> {cat.icon}
          </label>
        )}
      </div>
      <div>
        <label>Purposes: </label>
        {defaultPurposes.map(pur =>
          <label key={pur.id} style={{ marginRight: 6 }}>
            <input type="checkbox" checked={purposes.includes(pur.id)} onChange={e => {
              setPurposes(e.target.checked
                ? [...purposes, pur.id]
                : purposes.filter(id => id !== pur.id));
            }} /> {pur.icon}
          </label>
        )}
      </div>
      <div>
        <label>Weather: </label>
        <input value={context.weather || ''} onChange={e => setContext({ ...context, weather: e.target.value })} style={{ width: 60 }} />
        <label> Location: </label>
        <input value={context.location || ''} onChange={e => setContext({ ...context, location: e.target.value })} style={{ width: 60 }} />
        <label> Movement: </label>
        <input value={context.movement || ''} onChange={e => setContext({ ...context, movement: e.target.value })} style={{ width: 60 }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onSave({
          ...event,
          note,
          rating,
          categories,
          purposes,
          context
        })}>Save</button>
        {event.id && <button style={{ marginLeft: 12, color: 'red' }} onClick={() => onDelete(event)}>Delete</button>}
      </div>
    </div>
  );
}
