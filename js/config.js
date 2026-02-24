// ═══════════════════════════════════════
//  config.js
//  VERANDER DIT NAAR JOUW SERVER URL
//  na deployment op Railway
// ═══════════════════════════════════════

const CONFIG = {
  // Lokaal testen: 'ws://localhost:3000'
  // Na Railway deployment: 'wss://backend-production-825d.up.railway.app'
  WS_URL: window.location.hostname === 'localhost'
    ? 'ws://localhost:3000'
    : `wss://${window.location.hostname.replace('github.io','up.railway.app')}`,
};

// Overschrijf handmatig als nodig:
// CONFIG.WS_URL = 'wss://backend-production-825d.up.railway.app';
