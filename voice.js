/* ══════════════════════════════════════════
   voice.js — Voice command processing
══════════════════════════════════════════ */
let voiceRecog = null;

function startVoice() {
  const strip = document.getElementById('voiceStrip');
  strip?.classList.remove('hidden');
  const vsTxt = document.getElementById('vsTxt');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && !STATE.micActive) {
    STATE.micActive = true;
    voiceRecog = new SR();
    voiceRecog.lang = STATE.voiceLang === 'en' ? 'en-IN' : STATE.voiceLang === 'hi' ? 'hi-IN' : 'ta-IN';
    voiceRecog.continuous = false;
    voiceRecog.interimResults = false;
    voiceRecog.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (vsTxt) vsTxt.textContent = `"${transcript}"`;
      processVoiceCommand(transcript);
      STATE.micActive = false;
    };
    voiceRecog.onerror = () => {
      if (vsTxt) vsTxt.textContent = 'Try a demo phrase below ↓';
      STATE.micActive = false;
      showVoiceDemoPrompt();
    };
    voiceRecog.onend = () => { STATE.micActive = false; };
    voiceRecog.start();
    if (vsTxt) vsTxt.textContent = 'Listening... speak now';
  } else {
    if (vsTxt) vsTxt.textContent = 'Tap a demo phrase ↓';
    showVoiceDemoPrompt();
  }
}

function showVoiceDemoPrompt() {
  const strip = document.getElementById('voiceStrip');
  if (!strip || document.getElementById('voiceDemoRow')) return;
  const demos = ['Pay Rahul 500', 'Send Priya 1200', 'Pay Deepanshu 250'];
  const row = document.createElement('div');
  row.id = 'voiceDemoRow';
  row.style.cssText = 'padding:0 16px 12px;display:flex;flex-direction:column;gap:6px;';
  row.innerHTML = `<div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;padding-bottom:2px">Demo phrases:</div>` +
    demos.map(d => `<button onclick="simVoiceCmd('${d}')" style="text-align:left;background:var(--bg-card);border:1.5px solid var(--border);border-radius:10px;padding:9px 12px;font-size:13px;font-weight:600;color:var(--t1);cursor:pointer;font-family:Inter,sans-serif;display:flex;align-items:center;gap:8px;"><span>🎙</span>"${d}"</button>`).join('');
  strip.after(row);
}

function simVoiceCmd(text) {
  document.getElementById('voiceDemoRow')?.remove();
  document.getElementById('voiceStrip')?.classList.add('hidden');
  processVoiceCommand(text);
}

function setLang(lang) {
  STATE.voiceLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function processVoiceCommand(text) {
  const parser = VOICE_COMMANDS[STATE.voiceLang] || VOICE_COMMANDS.en;
  let result = parser.parse(text);
  if (!result.name && !result.amt) {
    const amtM = text.match(/\d+/);
    const nameM = text.match(/[A-Z][a-z]+/);
    result = { name: nameM ? nameM[0] : null, amt: amtM ? parseInt(amtM[0]) : null };
  }
  if (result.name) {
    const contact = CONTACTS.find(c => c.name.toLowerCase().includes(result.name.toLowerCase()));
    if (contact) {
      document.getElementById('sfName').value = contact.name;
      document.getElementById('sfUPI').value = contact.upi;
      checkUPIRep(contact.upi);
    } else {
      document.getElementById('sfName').value = result.name.charAt(0).toUpperCase() + result.name.slice(1);
    }
  }
  if (result.amt) {
    document.getElementById('sfAmt').value = result.amt;
    onAmtInput();
    showCashbackSuggestion();
  }
  showToast(`🎙 Voice: "${text}" → filled the form!`, 'blue');
}
