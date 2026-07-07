/* ═════════════════════════════════════════
   state.js — Global app state v3
══════════════════════════════════════════ */

const STATE = {
  userName: 'Avinish',
  walletBalance: 5000,
  cashback: 124,
  darkMode: false,
  currentScreen: 'scrHome',
  screenStack: [],

  sendName: '', sendUPI: '', sendAmt: 0, sendNote: '',
  dwellTimer: null, dwellFired: false,

  splitTotal: 0, splitTo: '',
  splitChecked: { 0: true, 1: true, 2: false, 3: false },

  bills: JSON.parse(JSON.stringify(BILLS)),
  transactions: [...INITIAL_TRANSACTIONS],
  insightsPeriod: 'week',

  voiceLang: 'en', recognition: null, micActive: false,

  settleData: JSON.parse(JSON.stringify(SETTLE_DATA)),
  securityShown: false,

  // v2 features
  receipts: [],
  budgets: {},
  rushDetected: false,
  navHistory: [],
  securitySettings: {
    doubleLockEnabled: true,
    doubleLockLimit: 1000,
    unusualTimeEnabled: true,
  },
  elderMode: false,
  copilotMemory: {},
  selectedCategory: 'transfer',
  simulateNightMode: false,
  forceAnomaly: false,

  // v3 new features
  timeCapsules: [],       // Feature A: time capsules
  offlineMode: false,     // Feature B: offline queue
  offlineQueue: [],       // Feature B: queued payments
};

function deductWallet(amount) {
  STATE.walletBalance = Math.max(0, STATE.walletBalance - amount);
  const el = document.getElementById('walletDisplay');
  if (el) el.textContent = '₹' + STATE.walletBalance.toLocaleString('en-IN');
}

function addTransaction(txn) {
  STATE.transactions.unshift({ id: Date.now(), ...txn, time: 'Just now' });
}
