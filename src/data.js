export const defaultCategories = [
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'learn', name: 'Learn', icon: '📚' },
  { id: 'play', name: 'Play', icon: '🎉' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧' },
  { id: 'grateful', name: 'Grateful', icon: '🙏' },
  { id: 'ego', name: 'Ego/Improve', icon: '🪞' },
  { id: 'connect', name: 'Connect/Value', icon: '🤝' },
  { id: 'exercise', name: 'Exercise', icon: '🏃‍♂️' },
  { id: 'errand', name: 'Errand', icon: '🛒' },
  { id: 'create', name: 'Create', icon: '🎨' },
  { id: 'career', name: 'Career', icon: '🎯' },
  { id: 'class', name: 'Class', icon: '🏫' },
  { id: 'kids', name: 'Kids', icon: '👶' },
  { id: 'bow', name: 'Bow', icon: '👩‍❤️‍💋‍👨' },
  { id: 'parent', name: 'Parents', icon: '👫' },
  { id: 'friend', name: 'Friend', icon: '🧑‍🤝‍🧑' },
  { id: 'volunteer', name: 'Volunteer', icon: '⚜️' },
  { id: 'commute', name: 'Commute', icon: '🚐' },
  { id: 'mindful', name: 'Mindful', icon: '🧘' },
  { id: 'meal', name: 'Meal', icon: '🍽️' },
  { id: 'media', name: 'Media', icon: '📺' },
  { id: 'money', name: 'Money', icon: '💰' },
  { id: 'read', name: 'Read', icon: '📖' }
];

export const defaultPurposes = [
  { id: 'meaning', name: 'Meaning', icon: '🌱' },
  { id: 'happy', name: 'Happy', icon: '😊' },
  { id: 'adventure', name: 'Adventure', icon: '🚀' }
];

export function loadData() {
  try { return JSON.parse(localStorage.getItem('journalEvents') || '{}'); }
  catch { return {}; }
}
export function saveData(obj) {
  localStorage.setItem('journalEvents', JSON.stringify(obj));
}

// Compute per-day metrics
export function computeDayMetrics(events) {
  const catCounts = {};
  let ratingSum = 0, ratingCount = 0;
  events.forEach(ev => {
    ratingSum += ev.rating;
    ratingCount++;
    ev.categories.forEach(cid => {
      catCounts[cid] = (catCounts[cid] || 0) + 1;
    });
  });
  const avgRating = ratingCount ? +(ratingSum / ratingCount).toFixed(2) : 0;
  return { catCounts, avgRating };
}

// Save all metrics in localStorage under 'journalMetrics'
export function saveAllMetrics(allEvents) {
  const metrics = {};
  Object.entries(allEvents).forEach(([date, events]) => {
    metrics[date] = computeDayMetrics(events);
  });
  localStorage.setItem('journalMetrics', JSON.stringify(metrics));
  return metrics;
}

// Load saved metrics
export function loadMetrics() {
  try { return JSON.parse(localStorage.getItem('journalMetrics')) || {}; }
  catch { return {}; }
}
