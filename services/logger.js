(function() {
  var LOG_KEY = "wa-security-log";
  var MAX_LOGS = 200;
  var stored;

  try {
    stored = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
  } catch (e) {
    stored = [];
  }

  window.__secLog = function(level, message, data) {
    var entry = {
      ts: new Date().toISOString(),
      level: level,
      msg: message,
      data: data || null
    };

    stored.push(entry);
    if (stored.length > MAX_LOGS) {
      stored = stored.slice(-MAX_LOGS);
    }
    try { localStorage.setItem(LOG_KEY, JSON.stringify(stored)); } catch (e) {}

    return entry;
  };

  window.__secLogs = function() { return stored.slice(); };
  window.__secLogsClear = function() {
    stored = [];
    localStorage.removeItem(LOG_KEY);
  };
})();
