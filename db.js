// ============================================================
//  DB.JS — Database Abstraction Layer via Vercel Serverless API
// ============================================================

async function signUpCreateGroup({ displayName, email, password, groupName }) {
  return await ApiClient.createGroup(displayName, email, password, groupName);
}

async function signUpJoinGroup({ displayName, email, password, inviteCode }) {
  return await ApiClient.joinGroup(displayName, email, password, inviteCode);
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
  // Polling every 10s for realtime-like updates when deployed
  const interval = setInterval(async () => {
    if (onUpdate) onUpdate();
  }, 10000);
  return () => clearInterval(interval);
}
