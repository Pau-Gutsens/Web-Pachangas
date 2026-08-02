// ============================================================
//  DB.JS — Database Abstraction Layer via Vercel Serverless API
// ============================================================

async function signUpUser({ displayName, email, password }) {
  return await ApiClient.signUp(displayName, email, password);
}

async function signInUser({ email, password }) {
  return await ApiClient.login(email, password);
}

async function signOutUser() {
  localStorage.removeItem('fc-colla-session');
}

async function fetchUserProfile(userId) {
  const session = localStorage.getItem('fc-colla-session');
  if (session) {
    try { return JSON.parse(session).profile; } catch (e) {}
  }
  return null;
}

async function fetchGroupData(groupId) {
  if (!groupId) return null;
  return await ApiClient.fetchGroupData(groupId);
}

async function saveMatchToDB(groupId, matchObj) {
  return await ApiClient.registerMatch(groupId, matchObj);
}

async function scheduleMatchToDB(groupId, scheduledObj) {
  return await ApiClient.scheduleMatch(groupId, scheduledObj);
}

async function saveProposalToDB(groupId, matchJornada, userId, proposalData) {
  return await ApiClient.saveProposal(groupId, matchJornada, userId, proposalData);
}

function subscribeToRealtime(groupId, onUpdate) {
  const interval = setInterval(async () => {
    if (onUpdate) onUpdate();
  }, 10000);
  return () => clearInterval(interval);
}
