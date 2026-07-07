/* ═════════════════════════════════════════
   features.js — All features v2 (fixed)
══════════════════════════════════════════ */

// ════════════════════════════════════════
//  FEATURE 1+2 — SECURITY (Biometric+OTP & Unusual Time)
// ════════════════════════════════════════
const SECURITY = {
  limit: 1000,
  otpCode: null,
  pendingPayment: null,

  // ── MAIN ENTRY POINT ──
  checkAndPay(name, upi, amt, note, category) {
    // Feature 2: Unusual time — check setting AND simulate hour
    const useSimulated = STATE.simulateNightMode === true;
    const realHour = new Date().getHours();
    const h = useSimulated ? 2 : realHour;

    if (STATE.securitySettings.unusualTimeEnabled && (h >= 23 || h < 5)) {
      this.showUnusualTimeAlert(name, upi, amt, note, category, h);
      return;
    }
    // Feature 1: Double lock
    if (STATE.securitySettings.doubleLockEnabled && amt >= SECURITY.limit) {
      this.showDoubleLockModal(name, upi, amt, note, category);
      return;
    }
    // Feature 7: Rush
    if (STATE.rushDetected && amt >= 500) {
      this.showRushPauseModal(name, upi, amt, note, category);
      return;
    }
    executePay(name, upi, amt, note, category);
  },

  // ── FEATURE 1: DOUBLE LOCK ──
  showDoubleLockModal(name, upi, amt, note, category) {
    this.pendingPayment = { name, upi, amt, note, category };
    this.otpCode = String(Math.floor(100000 + Math.random() * 900000));
    showModalContent(`
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:36px;margin-bottom:8px">🔐</div>
        <div style="font-size:17px;font-weight:800;color:var(--t1)">Double Security Check</div>
        <div style="font-size:12px;color:var(--t3);margin-top:4px">₹${amt.toLocaleString('en-IN')} to ${name} — needs extra verification</div>
      </div>
      <div class="cp-bubble" style="margin-bottom:14px">
        <div class="cp-hd">
          <div class="cp-dot"></div>
          <div class="cp-lbl">✦ Copilot · 98% confident</div>
          <div class="confidence-meter" style="margin-left:auto">
            <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:98%;background:var(--P)"></div></div>
            <div class="conf-label" style="color:var(--P)">High confidence</div>
          </div>
        </div>
        <div class="cp-txt"><b>Why this check?</b> Payments above ₹${SECURITY.limit.toLocaleString('en-IN')} are protected with fingerprint + OTP. This prevents unauthorised transfers.</div>
        <div class="copilot-why"><div class="why-label">Why did Copilot step in?</div><div class="why-text">Amount ₹${amt.toLocaleString('en-IN')} crossed your security threshold of ₹${SECURITY.limit.toLocaleString('en-IN')}. Double-lock activates automatically to protect your wallet.</div></div>
      </div>
      <div id="bioStep">
        <div style="font-size:13px;font-weight:700;color:var(--t1);margin-bottom:10px">Step 1 — Biometric Verification</div>
        <button onclick="SECURITY.simulateBiometric()" style="width:100%;padding:16px;background:var(--bg-blue);border:2px dashed var(--P);border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;color:var(--P);font-family:Inter,sans-serif;margin-bottom:8px">
          👆 Tap to scan fingerprint
        </button>
        <div style="font-size:11px;color:var(--t3);text-align:center">Face ID also accepted</div>
      </div>
      <div id="otpStep" style="display:none">
        <div style="font-size:13px;font-weight:700;color:var(--t1);margin-bottom:10px">Step 2 — OTP Verification</div>
        <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;border:1px solid var(--border-blue)">
          <div style="font-size:11px;color:var(--t3);margin-bottom:6px">OTP sent to +91 ****6789</div>
          <div style="font-size:28px;font-weight:900;color:var(--P);letter-spacing:8px;font-family:'DM Mono',monospace">${this.otpCode}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:6px">📱 Demo: OTP is shown above</div>
        </div>
        <input type="text" id="otpInput" maxlength="6" placeholder="Enter OTP"
          style="width:100%;padding:14px;border:2px solid var(--border);border-radius:12px;font-size:20px;font-weight:800;text-align:center;letter-spacing:8px;font-family:'DM Mono',monospace;color:var(--t1);background:var(--bg-inp);outline:none;margin-bottom:10px"
          oninput="if(this.value.length===6)SECURITY.verifyOTP()"/>
        <button onclick="SECURITY.verifyOTP()" style="width:100%;padding:14px;background:var(--P);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif">✓ Verify & Pay ₹${amt.toLocaleString('en-IN')}</button>
      </div>
      <button onclick="SECURITY.cancelPay()" style="width:100%;padding:10px;background:none;border:none;font-size:13px;color:var(--t3);cursor:pointer;margin-top:10px;font-family:Inter,sans-serif">Cancel payment</button>
    `);
  },

  simulateBiometric() {
    const bioStep = document.getElementById('bioStep');
    if (!bioStep) return;
    bioStep.innerHTML = `
      <div style="text-align:center;padding:12px">
        <div style="font-size:44px;margin-bottom:8px">✅</div>
        <div style="font-size:14px;font-weight:800;color:var(--success)">Fingerprint Verified!</div>
        <div style="font-size:11px;color:var(--t3);margin-top:4px">Loading OTP step...</div>
      </div>`;
    setTimeout(() => {
      bioStep.style.display = 'none';
      const otpStep = document.getElementById('otpStep');
      if (otpStep) { otpStep.style.display = 'block'; document.getElementById('otpInput')?.focus(); }
    }, 1200);
  },

  verifyOTP() {
    const input = document.getElementById('otpInput')?.value?.trim();
    if (input === this.otpCode) {
      document.getElementById('securityModal').classList.add('hidden');
      const p = this.pendingPayment; this.pendingPayment = null;
      showToast('🔐 Double verification passed! Processing...', 'green');
      setTimeout(() => executePay(p.name, p.upi, p.amt, p.note, p.category), 400);
    } else {
      const inp = document.getElementById('otpInput');
      if (inp) { inp.style.borderColor = 'var(--danger)'; inp.style.background = 'var(--err-l)'; inp.value = ''; }
      showToast('❌ Wrong OTP. Try again.', 'red');
      setTimeout(() => { if(inp){inp.style.borderColor='';inp.style.background='';} }, 1500);
    }
  },

  cancelPay() {
    document.getElementById('securityModal').classList.add('hidden');
    this.pendingPayment = null;
    showToast('Payment cancelled', 'orange');
  },

  // ── FEATURE 2: UNUSUAL TIME ──
  showUnusualTimeAlert(name, upi, amt, note, category, h) {
    this.pendingPayment = { name, upi, amt, note, category };
    const timeStr = `${h}:${String(new Date().getMinutes()).padStart(2,'0')} ${STATE.simulateNightMode ? '(simulated 2AM)' : ''}`;
    showModalContent(`
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:44px;margin-bottom:8px">🌙</div>
        <div style="font-size:18px;font-weight:900;color:var(--t1)">Late Night Payment Alert</div>
        <div style="font-size:12px;color:var(--t3);margin-top:4px">Current time: ${timeStr}</div>
      </div>
      <div class="cp-bubble" style="margin-bottom:14px">
        <div class="cp-hd">
          <div class="cp-dot"></div>
          <div class="cp-lbl">✦ Copilot · Late Night Alert</div>
          <div class="confidence-meter" style="margin-left:auto">
            <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:83%;background:var(--warning)"></div></div>
            <div class="conf-label" style="color:var(--warning)">83% — Medium risk</div>
          </div>
        </div>
        <div class="cp-txt">Payments between <b>11 PM and 5 AM</b> are 2–3× more likely to be impulsive or fraud-related. Are you sure you want to send <b>₹${amt.toLocaleString('en-IN')}</b> to <b>${name}</b> right now?</div>
        <div class="copilot-why"><div class="why-label">Why did Copilot step in?</div><div class="why-text">Unusual payment hour detected (${timeStr}). Copilot flags late-night transactions above ₹100 as an extra protection layer — especially for new recipients.</div></div>
      </div>
      <div style="display:flex;gap:10px">
        <button onclick="SECURITY.cancelPay()" style="flex:1;padding:13px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;color:var(--t2);font-family:Inter,sans-serif">😴 Wait till morning</button>
        <button onclick="SECURITY.proceedUnusual()" style="flex:1;padding:13px;background:var(--warning);border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;color:white;font-family:Inter,sans-serif">Yes, proceed</button>
      </div>
    `);
  },

  proceedUnusual() {
    document.getElementById('securityModal').classList.add('hidden');
    const p = this.pendingPayment; this.pendingPayment = null;
    if (STATE.securitySettings.doubleLockEnabled && p.amt >= SECURITY.limit) {
      setTimeout(() => this.showDoubleLockModal(p.name, p.upi, p.amt, p.note, p.category), 200);
    } else {
      executePay(p.name, p.upi, p.amt, p.note, p.category);
    }
  },

  // ── FEATURE 7: RUSH PAUSE ──
  showRushPauseModal(name, upi, amt, note, category) {
    this.pendingPayment = { name, upi, amt, note, category };
    let countdown = 3;
    showModalContent(`
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:44px;margin-bottom:8px">⚡</div>
        <div style="font-size:18px;font-weight:900;color:var(--t1)">You seem rushed!</div>
        <div style="font-size:12px;color:var(--t3);margin-top:4px">Copilot detected rapid navigation</div>
      </div>
      <div class="cp-bubble" style="margin-bottom:14px">
        <div class="cp-hd"><div class="cp-dot"></div><div class="cp-lbl">✦ Copilot · Mood Detection</div></div>
        <div class="cp-txt">You navigated through multiple screens very quickly before this payment. Taking 3 seconds helps avoid mistakes.<br><br>Paying <b>₹${amt.toLocaleString('en-IN')}</b> to <b>${name}</b></div>
        <div class="copilot-why"><div class="why-label">Why did Copilot step in?</div><div class="why-text">3+ screen changes in under 4 seconds detected before this payment. Rushed behaviour increases payment errors by 40%. A 3-second pause is all it takes to confirm intent.</div></div>
      </div>
      <div style="text-align:center;padding:16px 0">
        <div id="rushCountdown" style="font-size:56px;font-weight:900;color:var(--P);font-family:'DM Mono',monospace;transition:all 0.3s">3</div>
        <div style="font-size:12px;color:var(--t3)">Please wait...</div>
      </div>
      <button id="rushPayBtn" disabled style="width:100%;padding:14px;background:var(--t4);color:white;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:not-allowed;font-family:Inter,sans-serif;transition:all 0.3s">Please wait...</button>
      <button onclick="SECURITY.cancelPay()" style="width:100%;padding:10px;background:none;border:none;font-size:13px;color:var(--t3);cursor:pointer;margin-top:8px;font-family:Inter,sans-serif">Cancel</button>
    `);
    const iv = setInterval(() => {
      countdown--;
      const cd = document.getElementById('rushCountdown');
      const btn = document.getElementById('rushPayBtn');
      if (cd) { cd.textContent = countdown || '✓'; if(!countdown) cd.style.color = 'var(--success)'; }
      if (countdown <= 0) {
        clearInterval(iv);
        if (btn) {
          btn.disabled = false;
          btn.style.background = 'var(--P)';
          btn.style.cursor = 'pointer';
          btn.textContent = `✓ Confirm Pay ₹${amt.toLocaleString('en-IN')}`;
          btn.onclick = () => {
            document.getElementById('securityModal').classList.add('hidden');
            const p = SECURITY.pendingPayment; SECURITY.pendingPayment = null;
            executePay(p.name, p.upi, p.amt, p.note, p.category);
          };
        }
      }
    }, 1000);
    STATE.rushDetected = false;
  }
};

// ════════════════════════════════════════
//  RUSH DETECTION (Feature 7) — nav hook
// ════════════════════════════════════════
STATE.rushDetected = false;
STATE.navHistory = [];

const _origNavTo = APP.navTo.bind(APP);
APP.navTo = function(screenId) {
  const now = Date.now();
  STATE.navHistory.push(now);
  if (STATE.navHistory.length > 6) STATE.navHistory.shift();
  const recent = STATE.navHistory.filter(t => now - t < 4000);
  STATE.rushDetected = (recent.length >= 3 && screenId === 'scrSend');
  _origNavTo(screenId);
};

// ════════════════════════════════════════
//  FEATURE 6 — COPILOT RECEIPT (auto-generated)
// ════════════════════════════════════════
function generateReceipt(txn) {
  if (!STATE.receipts) STATE.receipts = [];
  const receipt = {
    id: txn.id || Date.now(),
    txnId: `P${Date.now().toString().slice(-10)}`,
    merchant: txn.name,
    upi: txn.upi || `${(txn.name||'').toLowerCase().replace(/\s/g,'.')}@paytm`,
    amt: txn.amt,
    note: txn.note || 'Payment',
    category: txn.category || txn.cat || 'transfer',
    date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }),
    time: new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }),
  };
  STATE.receipts.unshift(receipt);
  return receipt;
}

function showReceiptModal(txnOrReceipt) {
  const isReceipt = txnOrReceipt && txnOrReceipt.txnId;
  const r = isReceipt ? txnOrReceipt : generateReceipt(txnOrReceipt);
  const catColors = { food:'#ff7c00', bills:'#e02020', shopping:'#7c3aed', transfer:'#00BAF2', transport:'#00a86b', entertainment:'#e91e8c' };
  const catColor = catColors[r.category] || '#00BAF2';
  showModalContent(`
    <div class="receipt-header">
      <div style="font-size:10px;font-weight:800;letter-spacing:1px;opacity:0.85;text-transform:uppercase;margin-bottom:6px">✦ Paytm Copilot Receipt</div>
      <div style="font-size:30px;font-weight:900;margin:4px 0">₹${r.amt.toLocaleString('en-IN')}</div>
      <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:20px">
        <div style="width:7px;height:7px;border-radius:50%;background:#7fff7f"></div>
        <span style="font-size:12px;font-weight:700">Payment Successful</span>
      </div>
    </div>
    <div class="receipt-body">
      <div class="receipt-row"><span class="receipt-lbl">Merchant</span><span class="receipt-val"><b>${r.merchant}</b></span></div>
      <div class="receipt-row"><span class="receipt-lbl">UPI ID</span><span class="receipt-val" style="font-size:11px;font-family:'DM Mono',monospace">${r.upi}</span></div>
      <div class="receipt-row"><span class="receipt-lbl">Category</span><span class="receipt-val"><span style="background:${catColor};color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${r.category}</span></span></div>
      <div class="receipt-row"><span class="receipt-lbl">Note</span><span class="receipt-val">${r.note}</span></div>
      <div class="receipt-row"><span class="receipt-lbl">Date</span><span class="receipt-val">${r.date}</span></div>
      <div class="receipt-row"><span class="receipt-lbl">Time</span><span class="receipt-val">${r.time}</span></div>
      <div class="receipt-row" style="border:none"><span class="receipt-lbl">Txn ID</span><span class="receipt-val" style="font-family:'DM Mono',monospace;font-size:11px">${r.txnId}</span></div>
    </div>
    <div class="merchant-thankyou">
      <div style="font-size:10px;font-weight:800;color:var(--P);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:5px">✦ Merchant Message</div>
      <div style="font-size:12.5px;color:var(--t1);line-height:1.55">${getMerchantThankYou(r.merchant, STATE.userName)}</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button onclick="document.getElementById('securityModal').classList.add('hidden')" style="flex:1;padding:11px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:var(--t2);font-family:Inter,sans-serif">Close</button>
      <button onclick="shareReceipt()" style="flex:1;padding:11px;background:var(--P);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:white;font-family:Inter,sans-serif">📤 Share</button>
    </div>
  `);
}

function getMerchantThankYou(merchant, userName) {
  const messages = {
    'Swiggy':       `Thanks ${userName}! 🍕 Your order is being prepared. Track it in the Swiggy app.`,
    'Amazon':       `Order confirmed ${userName}! 📦 Expected delivery in 2-3 business days.`,
    'Jio Postpaid': `Your Jio account has been recharged successfully. Enjoy unlimited calls & data! 📱`,
    'Electricity':  `Payment received. No late fees will apply. Thank you for paying on time! ⚡`,
    'ACT Broadband':`Your broadband plan has been renewed. Enjoy high-speed internet! 🌐`,
    'Rent':         `Rent received for ${new Date().toLocaleString('default',{month:'long'})}. Your tenancy is active. 🏠`,
    'Netflix + Prime': `Your entertainment is renewed! Enjoy binge-watching 🎬`,
    'Gym Membership': `See you at the gym, ${userName}! Consistency is key 💪`,
  };
  return messages[merchant] || `Thank you for your payment, ${userName}! We appreciate your business. 😊`;
}

function shareReceipt() {
  document.getElementById('securityModal').classList.add('hidden');
  showToast('📤 Receipt copied to clipboard!', 'blue');
}

// ════════════════════════════════════════
//  FEATURE 8+9 — EXPLAINER + CONFIDENCE
// ════════════════════════════════════════
function getConfidenceMeter(pct, level) {
  const color = level === 'high' ? 'var(--P)' : level === 'medium' ? 'var(--warning)' : 'var(--t3)';
  const label = pct >= 85 ? 'High confidence' : pct >= 60 ? 'Medium confidence' : 'Low confidence';
  return `<div class="confidence-meter" style="margin-left:auto">
    <div class="conf-bar-bg"><div class="conf-bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="conf-label" style="color:${color}">${pct}% · ${label}</div>
  </div>`;
}

// ════════════════════════════════════════
//  FEATURE 11 — DEAL FINDER (fixed)
// ════════════════════════════════════════
const MERCHANT_DEALS = {
  'swiggy':         { display: 'Swiggy', deal: '15% off on orders above ₹299', code: 'SWIGPAYTM', expiry: 'Today only', icon: '🍕' },
  'amazon':         { display: 'Amazon', deal: '5% cashback with Paytm Pay Later', code: 'AMZPTM5', expiry: '3 days left', icon: '📦' },
  'zomato':         { display: 'Zomato', deal: '₹50 off on first 3 orders', code: 'ZOMPAYTM', expiry: 'This week', icon: '🍔' },
  'bigbasket':      { display: 'BigBasket', deal: '10% off on grocery orders ₹500+', code: 'BBPAYTM10', expiry: '2 days left', icon: '🛒' },
  'flipkart':       { display: 'Flipkart', deal: '7.5% extra discount on electronics', code: 'FKPAYTM', expiry: 'This weekend', icon: '🛍' },
  'dominos':        { display: "Domino's", deal: 'Buy 1 Get 1 on medium pizzas', code: 'DOMPAYTM', expiry: 'Today', icon: '🍕' },
  'mcdonalds':      { display: "McDonald's", deal: '₹30 off on McCombo meals', code: 'MCDPAYTM', expiry: 'Weekdays only', icon: '🍟' },
  'sharma':         { display: 'Sharma Store', deal: '10% off for Paytm payments', code: 'CASH10', expiry: 'Always', icon: '🏪' },
};

function checkMerchantDeal(name) {
  const strip = document.getElementById('dealStrip');
  if (!strip || !name) return;

  // Fuzzy match — check if typed name contains any merchant keyword
  const lower = name.toLowerCase().trim();
  let found = null;
  for (const [key, val] of Object.entries(MERCHANT_DEALS)) {
    if (lower.includes(key) || key.includes(lower.replace(/[^a-z]/g,''))) {
      found = val; break;
    }
  }

  if (!found) {
    strip.classList.add('hidden');
    strip.innerHTML = '';
    return;
  }

  strip.innerHTML = `
    <div class="deal-icon">${found.icon}</div>
    <div style="flex:1">
      <div style="font-size:10px;font-weight:800;color:var(--success);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:2px">✦ Copilot Deal Found · ${found.display}</div>
      <div style="font-size:12.5px;color:var(--t1);font-weight:600">${found.deal}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:2px">Use code: <b style="color:var(--success)">${found.code}</b> · ${found.expiry}</div>
    </div>
    <button onclick="this.parentElement.parentElement.classList.add('hidden')" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--t4);padding:0 4px">×</button>
  `;
  strip.classList.remove('hidden');
}

// ════════════════════════════════════════
//  FEATURE 12 — ELDER MODE (fixed)
// ════════════════════════════════════════
const ELDER = {
  active: false,

  activate() {
    this.active = true;
    STATE.elderMode = true;
    const app = document.getElementById('app');
    if (app) app.classList.add('elder-mode');
    const banner = document.getElementById('elderBanner');
    if (banner) banner.classList.remove('hidden');
    // Update toggle in settings if open
    const tog = document.getElementById('elderToggle');
    if (tog) tog.checked = true;
  },

  deactivate() {
    this.active = false;
    STATE.elderMode = false;
    const app = document.getElementById('app');
    if (app) app.classList.remove('elder-mode');
    const banner = document.getElementById('elderBanner');
    if (banner) banner.classList.add('hidden');
    const tog = document.getElementById('elderToggle');
    if (tog) tog.checked = false;
    showToast('Standard mode restored', 'blue');
  },

  guidedPayStep(step) {
    if (!this.active) return;
    const msgs = {
      1: '1️⃣ Type the name of who you want to pay',
      2: '2️⃣ Type the amount in rupees (numbers only)',
      3: '3️⃣ Check everything carefully, then tap PAY',
    };
    if (msgs[step]) showToast(msgs[step], 'blue');
  }
};

// ════════════════════════════════════════
//  NIGHT MODE SIMULATOR — for demo
// ════════════════════════════════════════
STATE.simulateNightMode = false;

function toggleNightSimulation() {
  STATE.simulateNightMode = !STATE.simulateNightMode;
  const btn = document.getElementById('nightSimBtn');
  if (btn) {
    btn.textContent = STATE.simulateNightMode ? '🌙 Night Mode ON (2AM simulated)' : '☀️ Simulate Night Mode';
    btn.style.background = STATE.simulateNightMode ? '#1a1a3a' : 'var(--bg)';
    btn.style.color = STATE.simulateNightMode ? '#99CCEE' : 'var(--t2)';
    btn.style.borderColor = STATE.simulateNightMode ? '#00BAF2' : 'var(--border)';
  }
  showToast(STATE.simulateNightMode ? '🌙 Night simulation ON — next payment will trigger alert' : '☀️ Night simulation OFF', STATE.simulateNightMode ? 'blue' : 'orange');
}

// ════════════════════════════════════════
//  CATEGORY PICKER — Feature for note field
// ════════════════════════════════════════
const PAYMENT_CATEGORIES = [
  { id: 'food',     label: 'Food & Dining',  icon: '🍕', color: '#ff7c00' },
  { id: 'shopping', label: 'Shopping',       icon: '🛍', color: '#7c3aed' },
  { id: 'transport',label: 'Transport',      icon: '🚗', color: '#00a86b' },
  { id: 'bills',    label: 'Bills',          icon: '⚡', color: '#e02020' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#e91e8c' },
  { id: 'health',   label: 'Health',         icon: '🏥', color: '#00BAF2' },
  { id: 'travel',   label: 'Travel',         icon: '✈️', color: '#00a86b' },
  { id: 'transfer', label: 'Transfer',       icon: '💸', color: '#00BAF2' },
  { id: 'other',    label: 'Other',          icon: '📌', color: '#8E8E93' },
];

STATE.selectedCategory = 'transfer';

function renderCategoryPicker() {
  const el = document.getElementById('categoryPicker');
  if (!el) return;
  el.innerHTML = `
    <div style="font-size:10px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:0.4px;margin-bottom:8px">Payment Category</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${PAYMENT_CATEGORIES.map(c => `
        <button onclick="selectCategory('${c.id}')" id="cat_${c.id}"
          style="display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:20px;border:1.5px solid ${STATE.selectedCategory===c.id ? c.color : 'var(--border)'};background:${STATE.selectedCategory===c.id ? c.color+'22' : 'var(--bg-card)'};cursor:pointer;font-size:11px;font-weight:${STATE.selectedCategory===c.id ? '800' : '600'};color:${STATE.selectedCategory===c.id ? c.color : 'var(--t2)'};font-family:Inter,sans-serif;transition:all 0.15s">
          <span>${c.icon}</span><span>${c.label}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function selectCategory(id) {
  STATE.selectedCategory = id;
  renderCategoryPicker();
  const cat = PAYMENT_CATEGORIES.find(c => c.id === id);
  if (cat) showToast(`Category set to ${cat.icon} ${cat.label}`, 'blue');
}

// ════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════
function showModalContent(html) {
  const box = document.getElementById('securityModalBox');
  if (box) box.innerHTML = html;
  document.getElementById('securityModal')?.classList.remove('hidden');
}

// ════════════════════════════════════════
//  MAIN PAY OVERRIDE
// ════════════════════════════════════════
function initiatePay() {
  const name = document.getElementById('sfName').value.trim();
  const upi  = document.getElementById('sfUPI').value.trim();
  const amt  = parseInt(document.getElementById('sfAmt').value) || 0;
  const note = document.getElementById('sfNote').value.trim();
  const category = STATE.selectedCategory || 'transfer';

  if (!name) { showToast('Enter recipient name', 'orange'); return; }
  if (amt <= 0) { showToast('Enter a valid amount', 'orange'); return; }
  if (amt > STATE.walletBalance) { showToast('Insufficient wallet balance', 'red'); return; }

  const upiVal = upi.toLowerCase();
  const suspicious = SUSPICIOUS_UPI_PATTERNS.some(p => upiVal.includes(p));
  if (amt > 10000 && suspicious) {
    showToast('⚠ High risk payment blocked. Block & Report recommended.', 'red');
    return;
  }

  clearDwellTimer();
  document.getElementById('dwellPopup')?.classList.add('hidden');

  // Elder mode guided steps
  if (ELDER.active) {
    ELDER.guidedPayStep(3);
    setTimeout(() => SECURITY.checkAndPay(name, upi, amt, note, category), 600);
    return;
  }

  SECURITY.checkAndPay(name, upi, amt, note, category);
}

function executePay(name, upi, amt, note, category) {
  const btn = document.getElementById('payBtn');
  if (btn) { btn.textContent = 'Processing...'; btn.disabled = true; }
  setTimeout(() => {
    if (btn) {
      btn.innerHTML = '<span>Pay Now</span><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
      btn.disabled = false;
    }
    deductWallet(amt);
    const txnCat = category || STATE.selectedCategory || 'transfer';
    const txnObj = {
      type: 'debit', name,
      note: note || 'UPI Transfer',
      amt,
      color: CONTACTS.find(c => c.name === name)?.color || '#00BAF2',
      cat: txnCat,
      category: txnCat,
      upi: upi
    };
    addTransaction(txnObj);
    generateReceipt({ ...txnObj, id: STATE.transactions[0].id });
    showSuccessScreen(name, upi, amt, note, txnCat);
  }, 1200);
}
