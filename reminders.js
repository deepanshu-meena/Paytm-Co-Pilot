/* ══════════════════════════════════════════
   reminders.js — Bills, Calendar, History
══════════════════════════════════════════ */
function renderRemindersHome() {
  const el = document.getElementById('remindersHome');
  if (!el) return;
  const today = new Date().getDate();
  const visible = STATE.bills.slice(0, 3);
  el.innerHTML = visible.map(b => {
    const rem = b.total - b.paid;
    const daysLeft = b.dueDay - today;
    const isOverdue = daysLeft < 0;
    const isSoon = daysLeft >= 0 && daysLeft <= 3;
    const isPaid = rem <= 0;
    const cls = isPaid ? 'rem-card-paid' : isOverdue ? 'rem-card-overdue' : isSoon ? 'rem-card-soon' : 'rem-card-ok';
    const stCls = isPaid ? 'rs-paid' : isOverdue ? 'rs-overdue' : isSoon ? 'rs-soon' : 'rs-ok';
    const stTxt = isPaid ? 'Paid ✓' : isOverdue ? `Overdue ${Math.abs(daysLeft)}d` : isSoon ? `Due in ${daysLeft}d` : `Due ${b.dueDay} Apr`;
    const pct = Math.round((b.paid / b.total) * 100);
    const barColor = isOverdue ? 'var(--danger)' : isSoon ? 'var(--warning)' : 'var(--success)';
    return `
      <div class="rem-card ${cls}">
        <div class="rem-top">
          <div class="rem-name">${b.icon} ${b.name}</div>
          <div class="rem-status ${stCls}">${stTxt}</div>
        </div>
        <div class="rem-amt">₹${rem.toLocaleString('en-IN')} <span style="font-size:12px;color:var(--t3);font-weight:500">of ₹${b.total.toLocaleString('en-IN')}</span></div>
        <div class="rem-due">Due: ${b.dueDay} April 2025</div>
        <div class="rem-progress"><div class="rem-prog-fill" style="width:${pct}%;background:${barColor}"></div></div>
        ${!isPaid ? `
          <div class="rem-pay-row">
            <input class="rem-pay-input" type="number" placeholder="Pay amount..." id="rpay_${b.id}" />
            <button class="rem-pay-btn" onclick="payBill('${b.id}')">Pay</button>
          </div>
        ` : '<div style="font-size:12px;color:var(--success);font-weight:700">✓ All paid this month</div>'}
      </div>
    `;
  }).join('');
}

function payBill(id) {
  const input = document.getElementById(`rpay_${id}`);
  const val = parseInt(input?.value) || 0;
  if (!val) { showToast('Enter amount first', 'orange'); return; }
  const bill = STATE.bills.find(b => b.id === id);
  if (!bill) return;
  const maxPay = bill.total - bill.paid;
  const paying = Math.min(val, maxPay);
  if (paying > STATE.walletBalance) { showToast('Insufficient balance', 'red'); return; }
  bill.paid += paying;
  deductWallet(paying);
  addTransaction({ type:'debit', name: bill.name, note:'Bill payment', amt: paying, color: '#e02020', cat:'bills' });
  showToast(`✓ ₹${paying.toLocaleString('en-IN')} paid to ${bill.name}!`, 'green');
  // Generate receipt
  generateReceipt({ name: bill.name, upi: 'bills@paytm', amt: paying, note: 'Bill payment', isAutoReceipt: true });
  renderRemindersHome();
}

function renderCalendar() {
  const el = document.getElementById('calendarScreen');
  if (!el) return;
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const billDays = {};
  STATE.bills.forEach(b => {
    if (!billDays[b.dueDay]) billDays[b.dueDay] = [];
    billDays[b.dueDay].push(b);
  });
  const dayHeaders = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  let gridCells = dayHeaders.map(d => `<div class="cal-day-hd">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) gridCells += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const bills = billDays[d] || [];
    const isToday = d === today;
    const hasBill = bills.length > 0;
    const dotColor = bills[0] ? (d < today ? 'var(--danger)' : d - today <= 3 ? 'var(--warning)' : 'var(--success)') : '';
    gridCells += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="showCalDay(${d})">${d}${hasBill ? `<div class="cal-day-dot" style="background:${dotColor}"></div>` : ''}</div>`;
  }
  el.innerHTML = `
    <div class="cal-month-nav">
      <button class="cal-nav-btn">‹</button>
      <div class="cal-month">${monthNames[month]} ${year}</div>
      <button class="cal-nav-btn">›</button>
    </div>
    <div class="cal-grid">${gridCells}</div>
    <div style="font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">All Bills This Month</div>
    <div class="cal-bills-list">
      ${STATE.bills.map(b => {
        const rem = b.total - b.paid;
        const daysLeft = b.dueDay - today;
        const isOverdue = daysLeft < 0;
        const borderColor = rem <= 0 ? 'var(--t4)' : isOverdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--success)';
        const amtColor = rem <= 0 ? 'var(--t3)' : isOverdue ? 'var(--danger)' : daysLeft <= 3 ? 'var(--warning)' : 'var(--success)';
        return `<div class="cal-bill-item" style="border-left-color:${borderColor}">
          <div class="cbi-icon">${b.icon}</div>
          <div class="cbi-info">
            <div class="cbi-name">${b.name}</div>
            <div class="cbi-due">Due: ${b.dueDay} April 2025 ${rem<=0?'· Paid ✓':isOverdue?`· Overdue ${Math.abs(daysLeft)}d`:daysLeft<=3?`· Due soon!`:''}</div>
          </div>
          <div class="cbi-amt" style="color:${amtColor}">₹${rem.toLocaleString('en-IN')}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function showCalDay(d) {
  const bills = STATE.bills.filter(b => b.dueDay === d);
  if (bills.length > 0) showToast(`${bills.map(b=>b.icon+' '+b.name).join(', ')} due on ${d} Apr`, 'orange');
}

function renderHistory() {
  const el = document.getElementById('historyScreen');
  if (!el) return;
  const cats = ['All','Food','Bills','Shopping','Transfer'];
  el.innerHTML = `
    <div class="hist-filter">
      ${cats.map((c,i) => `<button class="hf-btn ${i===0?'on':''}" onclick="filterHistory('${c}',this)">${c}</button>`).join('')}
    </div>
    <div id="histList"></div>`;
  renderHistList('All');
}

function filterHistory(cat, btn) {
  document.querySelectorAll('.hf-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderHistList(cat);
}

function renderHistList(cat) {
  const el = document.getElementById('histList');
  if (!el) return;
  const txns = cat === 'All' ? STATE.transactions : STATE.transactions.filter(t => t.cat && t.cat.toLowerCase().includes(cat.toLowerCase()));
  const groups = {};
  txns.forEach(t => {
    const g = t.time.includes('ago') || t.time === 'Just now' ? 'Today' : t.time === 'Yesterday' ? 'Yesterday' : 'Earlier';
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });
  el.innerHTML = Object.entries(groups).map(([label, ts]) => `
    <div class="hist-section-label">${label}</div>
    <div style="background:var(--bg-card)">
      ${ts.map(t => `
        <div class="txn-item" onclick="viewReceipt('${t.id}')">
          <div class="txn-avatar" style="background:${t.color}">${t.name[0]}</div>
          <div class="txn-info">
            <div class="txn-name">${t.name}</div>
            <div class="txn-note">${t.note}</div>
          </div>
          <div class="txn-amt">
            <div class="txn-amt-val ${t.type==='debit'?'txn-debit':'txn-credit'}">${t.type==='debit'?'−':'+'}₹${t.amt.toLocaleString('en-IN')}</div>
            <div class="txn-time">${t.time}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('') || `<div style="text-align:center;padding:40px;color:var(--t3)">No transactions found</div>`;
}

function viewReceipt(txnId) {
  const txn = STATE.transactions.find(t => String(t.id) === String(txnId));
  if (!txn || txn.type !== 'debit') return;
  showReceiptModal(txn);
}
