// src/Dashboard.js
import React, { useState, useEffect } from 'react';
import { loadData, defaultCategories, defaultPurposes } from './data';

// Helper to list all YYYY-MM-DD dates between two dates
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
  const [data, setData] = useState({});
  useEffect(() => {
    setData(loadData());
  }, []);

  // Default to last 7 days
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0,10);
  const defaultStart = new Date(today.getTime() - 6*24*60*60*1000)
                          .toISOString().slice(0,10);

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate]     = useState(defaultEnd);

  // 1) Gather all events in the selected range
  const datesInRange = getDatesInRange(startDate, endDate);
  const eventsInRange = datesInRange.flatMap(date =>
    (data[date] || []).map(ev => ({ ...ev, date }))
  );

  // 2) Category Pie (sorted by count)
  const catCounts = {};
  eventsInRange.forEach(ev =>
    ev.categories.forEach(cid =>
      catCounts[cid] = (catCounts[cid]||0) + 1
    )
  );
  // sort descending by count
  const sortedCats = Object.entries(catCounts)
    .sort((a,b)=> b[1] - a[1]);
  const pieData = {
    labels: sortedCats.map(([cid]) =>
      defaultCategories.find(c=>c.id===cid)?.icon || cid
    ),
    datasets: [{ data: sortedCats.map(([,cnt])=>cnt) }]
  };

  // 3) Purpose Bar (unchanged)
  const purCounts = {};
  eventsInRange.forEach(ev =>
    ev.purposes.forEach(pid =>
      purCounts[pid] = (purCounts[pid]||0) + 1
    )
  );
  const barData = {
    labels: Object.keys(purCounts).map(pid =>
      defaultPurposes.find(p=>p.id===pid)?.icon || pid
    ),
    datasets: [{ data: Object.values(purCounts) }]
  };

  // 4) Mood Timeline: average rating per day
  const moodByDate = {};
  eventsInRange.forEach(ev => {
    if (!moodByDate[ev.date]) moodByDate[ev.date] = { sum:0, count:0 };
    moodByDate[ev.date].sum   += ev.rating;
    moodByDate[ev.date].count += 1;
  });
  const timelineData = datesInRange.map(d => {
    const m = moodByDate[d];
    return m ? +(m.sum/m.count).toFixed(1) : null;
  });

  return (
    <div>
      <h3>Dashboard</h3>
      <div style={{ marginBottom: 16 }}>
        <label>
          From{' '}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </label>
        {'  '}
        <label>
          To{' '}
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <b>Category Pie</b>
          <PieChart data={pieData} />
        </div>
        <div>
          <b>Purpose Bar</b>
          <BarChart data={barData} />
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <b>Mood Timeline (avg per day)</b>
        <TimelineChart dates={datesInRange} data={timelineData} />
      </div>
    </div>
  );
}

// Simple placeholder charts—swap with Chart.js or other lib as desired
function PieChart({ data }) {
  if (!data.labels.length) return <div>No category data</div>;
  return (
    <div>
      {data.labels.map((l,i) =>
        <div key={l}>{l}: {data.datasets[0].data[i]}</div>
      )}
    </div>
  );
}
function BarChart({ data }) {
  if (!data.labels.length) return <div>No purpose data</div>;
  return (
    <div>
      {data.labels.map((l,i) =>
        <div key={l}>{l}: {'█'.repeat(data.datasets[0].data[i])}</div>
      )}
    </div>
  );
}
function TimelineChart({ dates, data }) {
  return (
    <div>
      {dates.map((d,i) => (
        <div key={d}>
          {d}: {data[i] !== null ? data[i] + '★' : '—'}
        </div>
      ))}
    </div>
  );
}
