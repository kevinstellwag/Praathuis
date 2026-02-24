// ═══════════════════════════════════════
//  ws.js — WebSocket verbinding
// ═══════════════════════════════════════

const WS = {
  socket:    null,
  connected: false,
  handlers:  {},
  _queue:    [],
  _retries:  0,

  connect() {
    const url = CONFIG.WS_URL;
    console.log('Verbinden met', url);
    document.getElementById('conn-status').textContent = '⏳ Verbinden...';

    try {
      this.socket = new WebSocket(url);
    } catch(e) {
      this._scheduleReconnect(); return;
    }

    this.socket.onopen = () => {
      this.connected = true;
      this._retries = 0;
      document.getElementById('conn-status').textContent = '✅ Verbonden';
      // Stuur wachtrij
      this._queue.forEach(m => this.socket.send(JSON.stringify(m)));
      this._queue = [];
    };

    this.socket.onclose = () => {
      this.connected = false;
      document.getElementById('conn-status').textContent = '🔴 Verbinding verloren — herverbinden...';
      this._scheduleReconnect();
    };

    this.socket.onerror = () => {
      document.getElementById('conn-status').textContent = '⚠️ Verbindingsfout';
    };

    this.socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        this._dispatch(msg);
      } catch(err) { console.error('WS parse fout:', err); }
    };
  },

  send(type, data = {}) {
    const msg = { type, data };
    if (this.connected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    } else {
      this._queue.push(msg);
    }
  },

  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = [];
    this.handlers[type].push(handler);
  },

  _dispatch(msg) {
    const handlers = this.handlers[msg.type] || [];
    handlers.forEach(h => h(msg.data));
    // Global fallback
    if (this.handlers['*']) this.handlers['*'].forEach(h => h(msg));
  },

  _scheduleReconnect() {
    this._retries++;
    const delay = Math.min(1000 * Math.pow(1.5, this._retries), 10000);
    setTimeout(() => this.connect(), delay);
  }
};
