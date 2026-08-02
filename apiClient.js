// ============================================================
//  APICLIENT.JS — Frontend API Client for Vercel Serverless API
// ============================================================

const ApiClient = {
  async post(endpoint, data) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en la petició');
      return json;
    } catch (err) {
      console.error(`[API Client Error ${endpoint}]:`, err);
      throw err;
    }
  },

  async get(endpoint) {
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error en la petició');
      return json;
    } catch (err) {
      console.error(`[API Client Error ${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth Methods
  login(email, password) {
    return this.post('/api/auth?action=login', { email, password });
  },

  signUp(displayName, email, password) {
    return this.post('/api/auth?action=signup', { displayName, email, password });
  },

  // Data Fetching
  fetchGroupData(groupId) {
    return this.get(`/api/data?groupId=${encodeURIComponent(groupId)}`);
  },

  // Match Writing
  registerMatch(groupId, matchObj) {
    return this.post('/api/matches?action=register', { groupId, matchObj });
  },

  scheduleMatch(groupId, scheduledObj) {
    return this.post('/api/matches?action=schedule', { groupId, scheduledObj });
  },

  // Proposal Writing
  saveProposal(groupId, matchJornada, userId, proposalData) {
    return this.post('/api/proposals', { groupId, matchJornada, userId, proposalData });
  }
};

window.ApiClient = ApiClient;
