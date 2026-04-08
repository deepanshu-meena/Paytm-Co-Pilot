/* ══════════════════════════════════════════
   insights.js — Live data + all insight features
══════════════════════════════════════════ */

// ── BUG FIX 1: Compute live spending from real STATE.transactions ──
function computeLiveSpending() {
  const CAT_MAP = {
    food:          { name:'Food & Dining',  icon:'🍕', color:'#ff7c00' },
    shopping:      { name:'Shopping',       icon:'🛍', color:'#7c3aed' },
    transport:     { name:'Transport',      icon:'🚗', color:'#00a86b' },
    bills:         { name:'Bills',          icon:'⚡', color:'#e02020' },
    telecom:       { name:'Bills',          icon:'⚡', color:'#e02020' },
    utility:       { name:'Bills',          icon:'⚡', color:'#e02020' },
    internet:      { name:'Bills',          icon:'⚡', color:'#e02020' },
    rent:          { name:'Bills',          icon:'⚡', color:'#e02020' },
    entertainment: { name:'Entertainment',  icon:'🎬', color:'#e91e8c' },
    health:        { name:'Health',         icon:'🏥', color:'#00BAF2' },
    travel:        { name:'Travel',         icon:'✈️', color:'#00a86b' },
    transfer:      { name:'Transfer',       icon:'💸', color:'#8E8E93' },
    other:         { name:'Other',          icon:'📌', color:'#8E8E93' },
  };

  const totals = {};
  const debits = STATE.transactions.filter(t => t.type === 'debit');

  debits.forEach(t => {
    const rawCat = (t.cat || t.category || 'other').toLowerCase();
    const mapped = CAT_MAP[rawCat] || CAT_MAP['other'];
    const key = mapped.name;
    if (!totals[key]) totals[key] = { ...mapped, amt: 0 };
    totals[key].amt += t.amt;
  });

  const categories = Object.values(totals).sort((a,b) => b.amt - a.amt);
  const total = categories.reduce((s,c) => s + c.amt, 0) || 0;
  categories.forEach(c => c.pct = total > 0 ? Math.round((c.amt/total)*100) : 0);

  // Day bars — last 7 days from real transactions
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const labels = [], values = [];
  for (let i = 6; i >= 0; i--) {
    labels.push(days[(today - i + 7) % 7]);
    const amt = debits.filter(t => {
      if (i === 0) return t.time === 'Just now' || t.time.includes('h ago') || t.time.includes('min');
      if (i === 1) return t.time === 'Yesterday';
      return t.time.includes(`${i} days ago`);
    }).reduce((s,t) => s + t.amt, 0);
    values.push(amt);
  }

  return { categories, total, labels, values };
}

// Merge live categories into static base data
function buildDisplayData() {
  const base = JSON.parse(JSON.stringify(SPENDING_DATA[STATE.insightsPeriod]));
  const live = computeLiveSpending();

  if (live.total === 0) return base; // no real payments yet, show demo data

  // Add live amounts on top of static categories
  live.categories.forEach(lc => {
    const existing = base.categories.find(sc => sc.name === lc.name);
    if (existing) {
      existing.amt += lc.amt;
    } else {
      base.categories.push({ ...lc });
    }
  });

  // Recompute percentages
  const total = base.categories.reduce((s,c) => s + c.amt, 0) || 1;
  base.categories.forEach(c => c.pct = Math.round((c.amt/total)*100));
  base.categories.sort((a,b) => b.amt - a.amt);

  // Add live daily values on top
  base.values = base.values.map((v,i) => v + (live.values[i] || 0));
  base.total += live.total;

  // Update tip with live biggest category
  const biggest = base.categories[0];
  if (biggest) {
    base.tip = `Your biggest spend is <strong>${biggest.icon} ${biggest.name}</strong> at ₹${biggest.amt.toLocaleString('en-IN')} — ${biggest.pct}% of total. ${biggest.pct > 40 ? 'That\'s over 40% of everything you spent!' : 'Keep an eye on this category.'}`;
  }

  return base;
}

function renderInsights() {
  const el = document.getElementById('insightsScreen');
  if (!el) return;

  const d = buildDisplayData(); // ← real + static merged
  const max = Math.max(...d.values, 1);
  const change = d.prevTotal > 0 ? ((d.total - d.prevTotal) / d.prevTotal * 100).toFixed(0) : 0;
  const up = d.total > d.prevTotal;
  const barColors = ['#00BAF2','#7c3aed','#e02020','#ff7c00','#00a86b','#e91e8c','#8E8E93'];

  // Budget alerts
  const budgetAlerts = (STATE.budgets && Object.keys(STATE.budgets).length > 0)
    ? d.categories.map(c => {
        const budget = STATE.budgets[c.name];
        if (!budget) return '';
        const pct = Math.round((c.amt/budget)*100);
        if (pct < 80) return '';
        return `<div class="budget-alert-item ${pct>=100?'over':'near'}">
          ${pct>=100?'🚨':'⚠️'} <b>${c.icon} ${c.name}</b>: ₹${c.amt.toLocaleString('en-IN')} of ₹${budget.toLocaleString('en-IN')} (${pct}%)
        </div>`;
      }).join('')
    : '';

  el.innerHTML = `
    <div class="ins-period-tabs">
      <button class="ipt ${STATE.insightsPeriod==='week'?'on':''}" onclick="switchInsightsPeriod('week')">This Week</button>
      <button class="ipt ${STATE.insightsPeriod==='month'?'on':''}" onclick="switchInsightsPeriod('month')">This Month</button>
    </div>
    ${budgetAlerts ? `<div class="budget-alerts-box">${budgetAlerts}</div>` : ''}
    <div class="ins-total-card">
      <div class="itc-lbl">Total Spent</div>
      <div class="itc-amt">₹${d.total.toLocaleString('en-IN')}</div>
      <span class="itc-change ${up?'itc-up':'itc-down'}">${up?'↑':'↓'} ${Math.abs(change)}% vs last ${STATE.insightsPeriod}</span>
    </div>
    <div class="ins-chart">
      <div class="ins-chart-title">Daily Spending ${computeLiveSpending().total>0?'<span style="font-size:10px;color:var(--P);font-weight:700">● Live data</span>':''}</div>
      <div class="bar-chart">
        ${d.values.map((v,i) => `
          <div class="bc-col">
            <div class="bc-val">${v>0?'₹'+(v>=1000?(v/1000).toFixed(1)+'k':v):''}</div>
            <div class="bc-bar" style="height:${Math.round((v/max)*80)+4}px;background:${v>0?barColors[i%barColors.length]:'var(--border)'}"></div>
            <div class="bc-lbl">${d.labels[i]}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="ins-cat">
      <div class="ins-cat-title">By Category</div>
      ${d.categories.map(c => `
        <div class="cat-row">
          <div class="cat-row-hd">
            <div class="cat-row-name"><span>${c.icon}</span> ${c.name}</div>
            <div><div class="cat-row-amt">₹${c.amt.toLocaleString('en-IN')}</div><div class="cat-pct">${c.pct}%</div></div>
          </div>
          <div class="cat-bar"><div class="cat-bar-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
        </div>`).join('')}
    </div>
    <div class="copilot-tip">
      <div class="ct-hd"><div class="ct-hd-dot"></div><div class="ct-hd-lbl">✦ Copilot Insight</div></div>
      <div class="ct-body">${d.tip}</div>
    </div>
    <div class="budget-manager-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:13px;font-weight:700;color:var(--t1)">🎯 Category Budgets</div>
        <button onclick="showBudgetEditor()" style="font-size:11px;color:var(--P);font-weight:700;background:none;border:none;cursor:pointer;font-family:Inter,sans-serif">Edit →</button>
      </div>
      <div>${renderBudgetBars(d)}</div>
    </div>
    <button class="roast-btn" onclick="roastMySpending()">
      🔥 Roast My Spending
      <span style="font-size:11px;display:block;opacity:0.8;font-weight:500;margin-top:2px">Copilot gives you the brutal truth</span>
    </button>
    <div id="anomalyPanel"></div>
  `;

  checkSpendingAnomalies(d);
}

function renderBudgetBars(d) {
  if (!STATE.budgets || Object.keys(STATE.budgets).length === 0) {
    return '<div style="font-size:12px;color:var(--t3);text-align:center;padding:8px 0">No budgets set yet. Tap Edit to add limits per category.</div>';
  }
  return d.categories.map(c => {
    const budget = STATE.budgets[c.name];
    if (!budget) return '';
    const pct = Math.min(100, Math.round((c.amt/budget)*100));
    const col = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)';
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:12px;font-weight:600;color:var(--t1)">${c.icon} ${c.name}</span>
        <span style="font-size:12px;font-weight:700;color:${col}">₹${c.amt.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')}</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${col};border-radius:3px;transition:width .6s"></div>
      </div>
    </div>`;
  }).filter(Boolean).join('');
}

function showBudgetEditor() {
  const cats = SPENDING_DATA.week.categories;
  showModalContent(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:17px;font-weight:800;color:var(--t1)">🎯 Set Budgets</div>
      <button onclick="document.getElementById('securityModal').classList.add('hidden')" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--t3)">×</button>
    </div>
    <div style="font-size:12px;color:var(--t3);margin-bottom:14px">Copilot warns at 80% and blocks at 100%</div>
    ${cats.map(c => `
      <div style="margin-bottom:12px">
        <label style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:5px">${c.icon} ${c.name}</label>
        <input type="number" id="bgt_${c.name.replace(/[^a-z]/gi,'_')}"
          value="${(STATE.budgets||{})[c.name]||''}" placeholder="Leave blank = no limit"
          style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:14px;font-weight:600;color:var(--t1);background:var(--bg-inp);font-family:Inter,sans-serif;outline:none"/>
      </div>`).join('')}
    <button onclick="saveBudgets()" style="width:100%;padding:13px;background:var(--P);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;margin-top:4px">✓ Save Budgets</button>
  `);
}

function saveBudgets() {
  if (!STATE.budgets) STATE.budgets = {};
  SPENDING_DATA.week.categories.forEach(c => {
    const el = document.getElementById(`bgt_${c.name.replace(/[^a-z]/gi,'_')}`);
    const val = parseInt(el?.value);
    if (val > 0) STATE.budgets[c.name] = val;
    else delete STATE.budgets[c.name];
  });
  document.getElementById('securityModal').classList.add('hidden');
  showToast('✓ Budgets saved!', 'green');
  renderInsights();
}

function switchInsightsPeriod(p) { STATE.insightsPeriod = p; renderInsights(); }

// ── ROAST (uses live data) ──
function roastMySpending() {
  const d = buildDisplayData();
  const name = STATE.userName;
  const biggest = d.categories[0];
  const roastMap = {
    'Food & Dining': `${name}, ₹${biggest?.amt?.toLocaleString('en-IN')} on food this ${STATE.insightsPeriod}. That's ${Math.round((biggest?.amt||0)/80)} plates of dal chawal. You could've hired a part-time cook AND a food critic. Swiggy probably has a dedicated rider just for your building.`,
    'Shopping':      `₹${biggest?.amt?.toLocaleString('en-IN')} on shopping. Your cart is fuller than your savings account. Amazon is considering renaming Prime to "${name}'s Personal Shopper." The only thing growing faster than your wishlist is your regret.`,
    'Entertainment': `₹${biggest?.amt?.toLocaleString('en-IN')} on entertainment. You have enough subscriptions to watch something new every day for ${Math.round((biggest?.amt||0)/199)} months. You still say "there's nothing to watch."`,
    'Bills':         `₹${biggest?.amt?.toLocaleString('en-IN')} on bills. Your electricity provider sent you a Diwali card this year. You are single-handedly keeping the grid alive.`,
    'Transport':     `₹${biggest?.amt?.toLocaleString('en-IN')} on transport. For that you could've bought a cycle, gotten fit, and saved the planet. But here we are, in a cab, scrolling Instagram.`,
    'Travel':        `₹${biggest?.amt?.toLocaleString('en-IN')} on travel. Points for ambition. Zero points for the wallet. Your passport is thriving. Your savings? Not invited on the trip.`,
    'Transfer':      `₹${biggest?.amt?.toLocaleString('en-IN')} sent to others. You're everyone's favourite person — the one who pays first and gets paid back... never. Copilot checked. Rahul still owes you ₹300.`,
  };
  const roast = roastMap[biggest?.name] || `${name}, your spending is genuinely impressive. Copilot is concerned AND slightly in awe.`;
  const diff = Math.abs(d.total - d.prevTotal).toLocaleString('en-IN');
  const extra = d.total > d.prevTotal
    ? `\n\nAlso — ₹${diff} MORE than last ${STATE.insightsPeriod}. Inflation? No. Just choices.`
    : `\n\nBright side: ₹${diff} LESS than last ${STATE.insightsPeriod}. Copilot is genuinely shocked. In a good way.`;

  showModalContent(`
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:44px;margin-bottom:6px">🔥</div>
      <div style="font-size:18px;font-weight:900;color:var(--t1)">Copilot Roast</div>
      <div style="font-size:11px;color:var(--t3)">Brutally honest · Slightly funny · 100% accurate</div>
    </div>
    <div style="background:linear-gradient(135deg,#1a0800,#2d1000);border-radius:14px;padding:16px;margin-bottom:16px;border-left:4px solid #ff6b35">
      <div style="font-size:13px;color:#FFD0A8;line-height:1.75;white-space:pre-line">${roast+extra}</div>
    </div>
    <div style="display:flex;gap:10px">
      <button onclick="document.getElementById('securityModal').classList.add('hidden')" style="flex:1;padding:12px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:var(--t2);font-family:Inter,sans-serif">😔 Fair enough</button>
      <button onclick="document.getElementById('securityModal').classList.add('hidden');showToast('📸 Screenshot and share! 🔥','blue')" style="flex:1;padding:12px;background:linear-gradient(135deg,#ff6b35,#ff3d3d);border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;color:white;font-family:Inter,sans-serif">📸 Share</button>
    </div>
  `);
}

// ── ANOMALY DETECTION ──
function checkSpendingAnomalies(d) {
  const panel = document.getElementById('anomalyPanel');
  if (!panel) return;

  if (STATE.forceAnomaly) {
    STATE.forceAnomaly = false;
    panel.innerHTML = buildAnomalyCard([
      { icon:'🛍', name:'Shopping', badge:'156% spike', desc:'₹1,799 this week vs your usual ₹700 — that\'s 2.5× higher than average.' },
      { icon:'🍕', name:'Food & Dining', badge:'Saturday spike', desc:'You spent ₹660 in one day — 3× your daily average. Big meal?' },
    ]);
    return;
  }

  // Auto detect: compare live vs static baseline
  const live = computeLiveSpending();
  const found = [];
  live.categories.forEach(lc => {
    const base = SPENDING_DATA[STATE.insightsPeriod].categories.find(bc => bc.name === lc.name);
    if (base && lc.amt > base.amt * 0.3) {
      const pct = Math.round((lc.amt / base.amt) * 100);
      found.push({ icon: lc.icon, name: lc.name, badge: `+${pct}% above baseline`, desc: `Your new payments added ₹${lc.amt.toLocaleString('en-IN')} on top of the usual ₹${base.amt.toLocaleString('en-IN')}.` });
    }
  });

  if (found.length === 0) { panel.innerHTML = ''; return; }
  panel.innerHTML = buildAnomalyCard(found);
}

function buildAnomalyCard(items) {
  return `<div class="anomaly-card">
    <div class="cp-hd"><div class="cp-dot"></div><div class="cp-lbl">✦ Copilot · ${items.length} Anomaly${items.length>1?'s':''} Detected</div></div>
    ${items.map(a => `
      <div class="anomaly-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:13px;font-weight:700;color:var(--t1)">${a.icon} ${a.name}</span>
          <span style="font-size:10px;font-weight:800;background:#FFF5E6;color:#9A5C00;padding:2px 8px;border-radius:10px">${a.badge}</span>
        </div>
        <div style="font-size:12px;color:var(--t2);margin-bottom:8px">${a.desc}</div>
        <div style="display:flex;gap:6px">
          <button onclick="dismissAnomaly(this)" style="font-size:11px;padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-family:Inter,sans-serif;color:var(--t2)">✓ Intentional</button>
          <button onclick="navTo('scrInsights')" style="font-size:11px;padding:5px 12px;border-radius:20px;border:none;background:var(--P);color:white;cursor:pointer;font-family:Inter,sans-serif">Review</button>
        </div>
      </div>`).join('')}
  </div>`;
}

function dismissAnomaly(btn) {
  const item = btn.closest('.anomaly-item');
  if (item) { item.style.opacity = '0.4'; item.style.pointerEvents = 'none'; }
  showToast('✓ Marked as intentional', 'green');
}
