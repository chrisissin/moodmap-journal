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
