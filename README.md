# 💸 Paytm Co-Pilot

**An AI-powered payment assistant concept — built as a hackathon prototype on top of a simulated Paytm-style UPI wallet.**

Paytm Co-Pilot is a front-end simulation of what an "AI layer" over a UPI payments app could look like. It watches how a user behaves while paying — hesitation, odd hours, risky UPI IDs, large amounts — and proactively steps in with the right nudge: split a bill, double-check for fraud, add extra security, or just help you pay faster with your voice.

> ⚠️ This is a **UI/UX + front-end logic prototype**. There is no real backend, no real UPI network, and no real money movement — all data is mocked and lives in the browser's memory for the duration of the session.

---

## 🎥 What It Does

| Feature | What it simulates |
|---|---|
| 🕵️ **Dwell Detection** | If you pause on the "Send Money" screen for 7+ seconds with a name & amount filled, Copilot assumes you're hesitating over a group bill and offers to split it |
| 🛡️ **Fraud & UPI Reputation Check** | Every UPI ID you type is scored (known/unknown, account age, suspicious keyword patterns like `kyc`, `refund`, `winner`) and a live risk bar updates as you type the amount |
| 🔐 **Double-Lock Security** | Payments above ₹1,000 require simulated fingerprint + OTP verification |
| 🌙 **Unusual Time Guard** | Payments between 11 PM–5 AM trigger an extra confirmation step — and large payments made at night are **force-routed** through Double-Lock even if that setting is off, closing a bypass loophole |
| 🎙️ **Voice Commands** | Speak (or pick a demo phrase) in **English, Hindi, or Tamil** — "Pay Rahul 500" or "Rahul ko paanch sau bhejo" — and Copilot fills the payment form for you |
| 💰 **Bill Splitting & Settle Up** | Split a payment with friends, auto-message them for their share, and track who's paid via a simulated chat thread |
| 📊 **Spending Insights** | Weekly/monthly category breakdowns, anomaly detection (e.g. "Shopping is 156% above your usual"), and budget alerts at 80%/100% |
| 🔥 **Roast My Spending** | A templated, personality-driven "AI roast" of your spending habits, generated from your real transaction data |
| 🧾 **Auto Digital Receipts** | Every payment generates a shareable receipt with a merchant "thank you" message |
| ⏳ **Time Capsule** | Lock money away until a future date — a gamified way to save |
| 📴 **Offline Payment Queue** | Simulates paying with no internet — payments are queued and "synced" once back online |
| 💼 **Salary Autopilot** | Auto-splits an incoming salary credit across bills, savings, and spending money |
| 🧠 **Smart Payback Sequencer** | Suggests the optimal order to pay back multiple people you owe money to |
| 👴 **Elder / Easy Mode** | Larger text & buttons for accessibility |

---

## 🏗️ Architecture

This is a **vanilla HTML/CSS/JavaScript** single-page app — no frameworks, no build step, no bundler. Everything runs directly in the browser off one shared global `STATE` object.

```
index.html            → single-page shell; all "screens" are <div>s toggled via CSS classes
│
├── data.js           → static mock data: contacts, known UPI IDs, bills, transactions, voice grammars
├── state.js          → the single source of truth (STATE object) + core mutators (deductWallet, addTransaction)
├── ui.js             → screen navigation (SPA routing without a router), rendering, toasts, onboarding
├── send.js           → send-money form: autocomplete, UPI reputation, live risk bar, dwell-timer trigger
├── split.js          → bill-splitting screen + "Settle Up" (who owes whom) + transaction history rendering
├── voice.js          → Web Speech API integration + regex/keyword-based multilingual command parsing
├── insights.js       → live spending analytics, anomaly detection, budgets, the "Roast" generator
├── reminders.js      → bill reminder cards, calendar view, transaction history filtering
├── features.js       → security engine (SECURITY object): double-lock, OTP, unusual-time, biometric sim, receipts
├── newfeatures.js    → time capsule, offline queue, salary autopilot, payback sequencer + a security patch
└── app.js            → boots the app on page load
```

### Why this structure matters (and what it shows)
- **No framework, but still componentized** — each `.js` file owns one domain (payments, security, insights…), which keeps ~5,000 lines of code navigable without React/Vue.
- **One global `STATE` object** acts like a mini Redux store — every screen reads/writes from it directly instead of passing props around.
- **"Screens" are just `<div class="screen">` elements** shown/hidden via a `navTo()` / `navBack()` stack (`STATE.navHistory`) — a hand-rolled SPA router.
- **Feature modules communicate through shared globals and DOM IDs** rather than a formal event bus — simple for a hackathon, but a known trade-off (see [Trade-offs](#-trade-offs--what-id-do-differently-in-production) below).

---

## 🔍 How Key Features Actually Work

### 1. Dwell-Time Detection → Split Suggestion (`send.js`)
```js
function startDwellTimer() {
  STATE.dwellTimer = setTimeout(() => { ... }, 7000); // 7s pause = "hesitation"
}
```
When the user focuses the amount field, a 7-second timer starts. If they haven't submitted by then (and a name + amount are filled), Copilot assumes hesitation is about splitting a bill and shows a "Want to split this?" popup — with an explicit **"Why did Copilot step in?"** explanation panel, mimicking explainable-AI UX patterns real fintech apps use.

### 2. Layered Fraud & Security Pipeline (`features.js` → `SECURITY.checkAndPay`)
Every payment passes through an ordered check:
```
Unusual time (11pm–5am)? → extra confirmation
     ↓
Amount ≥ ₹1,000?          → biometric + OTP (Double-Lock)
     ↓
"Rush" behavior detected?  → pause modal
     ↓
executePay()
```
`newfeatures.js` patches this pipeline (`patchSecurity` IIFE) so that **a large night-time payment can't skip Double-Lock even if the user disabled it** — a deliberate fix for a security bypass, and a good example of defense-in-depth thinking.

### 3. UPI Reputation Scoring (`send.js` → `checkUPIRep`)
Known UPI IDs pull from a mock trust database (`KNOWN_UPI`); unknown ones are scored against a `SUSPICIOUS_UPI_PATTERNS` list (`kyc`, `refund`, `winner`, etc.) with a randomized-but-bounded trust score — simulating what a real fraud-detection heuristic engine would output.

### 4. Live Insights, Not Just Static Charts (`insights.js`)
`computeLiveSpending()` recalculates category totals directly from `STATE.transactions` (real actions taken during the session) and **merges** them into a static baseline dataset (`buildDisplayData()`), so charts, the anomaly detector, and the "Roast" generator all reflect what the user actually just did — not canned demo numbers.

### 5. Voice Commands, Multilingual (`voice.js` + `data.js`)
Uses the browser's `SpeechRecognition` API where available, with a graceful fallback to tappable demo phrases. Parsing is done with **regex for English** ("pay X 500") and a **word-to-number dictionary for Hindi** ("paanch sau" → 500), showing handling of non-trivial NLP-lite logic without an external API.

---

## 🧰 Tech Stack

- **HTML5 / CSS3** — custom design system (CSS variables for theming, dark mode via a class toggle)
- **Vanilla JavaScript (ES6+)** — no framework, no dependencies, no build tools
- **Web APIs used:** `SpeechRecognition` (voice), in-memory state (no `localStorage` dependency), `setTimeout`-based simulations for async/network behavior
- **Fonts:** Inter, DM Mono (Google Fonts)

---

## ▶️ Running It Locally

No build step required.
```bash
git clone https://github.com/<your-username>/Paytm-Co-Pilot.git
cd Paytm-Co-Pilot
# just open index.html in a browser, or serve it:
npx serve .
```

---

## ⚖️ Trade-offs & What I'd Do Differently in Production

- **No backend / persistence** — all state resets on refresh. In production this would be an actual UPI PSP integration with a real database, not `STATE` in memory.
- **Global state instead of a framework** — fine at ~5k lines with one contributor; would migrate to React + a proper store (Redux/Zustand) as the codebase and team grow, to get component isolation and testability.
- **DOM IDs as the "wiring" between modules** — works, but is fragile (typos break silently). A production version would use an event bus or component props instead of `document.getElementById` scattered across files.
- **Fraud scores are randomized within bounds**, not ML-driven — a real system would use a trained model on transaction graphs, device fingerprinting, and velocity checks.
- **No automated tests** — a real fintech codebase would need unit tests around the security pipeline (`SECURITY.checkAndPay`) especially, since it's the highest-stakes logic path.

---

## 🙋 About This Project

Built as a hackathon project to explore what proactive, explainable AI assistance could look like inside a UPI payments app — going beyond chat-based assistants to **behavioral, in-context nudges** (dwell detection, anomaly alerts) paired with **transparent reasoning** ("Why did Copilot step in?") so users trust automated interventions instead of being confused by them.
