/* ══════════════════════════════════════════
   app.js — Boot (always light mode)
══════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  STATE.darkMode = false;
  document.body.classList.remove('dark');
  document.getElementById('app')?.classList.remove('dark');
  document.body.style.colorScheme = 'light';
});
