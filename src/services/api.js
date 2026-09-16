const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const apiClient = {
  // Check backend health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Fetch Primary Admin User ("Me")
  async getMe() {
    const res = await fetch(`${API_BASE}/api/me`);
    if (!res.ok) throw new Error('Failed to fetch primary user profile');
    return res.json();
  },

  // Create or Upsert a Person
  async savePerson(personData) {
    const res = await fetch(`${API_BASE}/api/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personData),
    });
    return res.json();
  },

  // Update a Person's Role/Position
  async updatePerson(id, updates) {
    const res = await fetch(`${API_BASE}/api/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  }
};
