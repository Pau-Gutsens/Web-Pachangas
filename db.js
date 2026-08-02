// ============================================================
//  DB.JS — Capa d'Abstracció via Vercel Serverless API
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

async function fetchGroupData() {
  return await ApiClient.fetchGroupData();
}

async function saveMatchToDB(matchObj) {
  return await ApiClient.registerMatch(matchObj);
}

async function scheduleMatchToDB(scheduledObj) {
  return await ApiClient.scheduleMatch(scheduledObj);
}

async function saveProposalToDB(matchJornada, userId, proposalData) {
  return await ApiClient.saveProposal(matchJornada, userId, proposalData);
}

function subscribeToRealtime(groupId, onUpdate) {
  const interval = setInterval(async () => {
    if (onUpdate) onUpdate();
  }, 10000);
  return () => clearInterval(interval);
}
