(function () {
  'use strict';

  const STYLE_ID = 'extrajud-terminal-logger-styles';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tj-log-card {
        margin: 0 0 10px 0;
        padding: 10px 12px;
        border: 1px solid var(--border-color, #334155);
        border-radius: 10px;
        background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.02));
        color: var(--text-color, #e5e7eb);
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      }
      .tj-log-head {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
        margin-bottom: 8px;
        font-family: 'JetBrains Mono', 'Consolas', monospace;
        font-size: 11px;
        line-height: 1.2;
      }
      .tj-log-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .tj-log-chip-info { background: rgba(59,130,246,0.12); color: #60a5fa; border-color: rgba(59,130,246,0.28); }
      .tj-log-chip-warn { background: rgba(245,158,11,0.12); color: #f59e0b; border-color: rgba(245,158,11,0.28); }
      .tj-log-chip-error { background: rgba(239,68,68,0.12); color: #ef4444; border-color: rgba(239,68,68,0.28); }
      .tj-log-chip-success { background: rgba(16,185,129,0.12); color: #10b981; border-color: rgba(16,185,129,0.28); }
      .tj-log-chip-input { background: rgba(168,85,247,0.12); color: #a855f7; border-color: rgba(168,85,247,0.28); }
      .tj-log-chip-debug { background: rgba(148,163,184,0.12); color: #94a3b8; border-color: rgba(148,163,184,0.28); }
      .tj-log-time { color: var(--text-secondary, #94a3b8); }
      .tj-log-message {
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .tj-log-details {
        margin-top: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.45);
        color: var(--text-secondary, #cbd5e1);
        font-family: 'JetBrains Mono', 'Consolas', monospace;
        font-size: 11px;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
        overflow: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeType(value) {
    const type = String(value || 'info').toLowerCase();
    if (type.startsWith('log-')) return normalizeType(type.slice(4));
    if (type === 'warning') return 'warn';
    if (type === 'ok' || type === 'done') return 'success';
    if (type === 'err' || type === 'fatal') return 'error';
    if (type === 'input' || type === 'prompt') return 'input';
    if (type === 'trace' || type === 'debug') return 'debug';
    if (type === 'success' || type === 'warn' || type === 'error' || type === 'info') return type;
    return 'info';
  }

  function inferTypeFromMessage(message) {
    const text = String(message || '');
    if (/\b(erro|falha|exception|fatal)\b/i.test(text)) return 'error';
    if (/\b(sucesso|conclu[ií]do|finalizado)\b/i.test(text)) return 'success';
    if (/\b(aviso|aten[cç][aã]o|warning)\b/i.test(text)) return 'warn';
    if (/\b(>+|input|pergunta)\b/i.test(text)) return 'input';
    return 'info';
  }

  function normalize(payload, fallback = {}) {
    const source = typeof payload === 'string' ? { msg: payload } : (payload && typeof payload === 'object' ? payload : { msg: String(payload) });
    const msg = source.msg ?? source.message ?? source.text ?? '';
    const normalizedType = normalizeType(source.type ?? source.level ?? fallback.type ?? fallback.typeClass ?? inferTypeFromMessage(msg));
    const tech = source.tech ?? source.context ?? fallback.tech ?? '';
    const sourceLabel = source.source ?? fallback.source ?? '';
    const timestamp = source.timestamp ?? fallback.timestamp ?? new Date().toISOString();

    let details = source.details ?? source.raw ?? '';
    if (!details && source && typeof source === 'object') {
      const extra = {};
      const skip = new Set(['msg', 'message', 'text', 'type', 'level', 'tech', 'source', 'timestamp', 'details', 'raw', 'typeClass', 'context']);
      Object.keys(source).forEach((key) => {
        if (!skip.has(key) && source[key] !== undefined) extra[key] = source[key];
      });
      if (Object.keys(extra).length) {
        try { details = JSON.stringify(extra, null, 2); }
        catch (_) { details = String(extra); }
      }
    }

    return {
      msg: String(msg ?? ''),
      type: normalizedType,
      tech: tech ? String(tech) : '',
      source: sourceLabel ? String(sourceLabel) : '',
      timestamp,
      details: details ? String(details) : ''
    };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTime(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    try { return date.toLocaleTimeString('pt-BR', { hour12: false }); }
    catch (_) { return date.toISOString().slice(11, 19); }
  }

  function render(entry) {
    const chipType = normalizeType(entry.type || 'info');
    const chips = [
      `<span class="tj-log-chip tj-log-chip-${chipType}">${escapeHtml(chipType.toUpperCase())}</span>`,
      `<span class="tj-log-chip tj-log-time">${escapeHtml(formatTime(entry.timestamp))}</span>`
    ];
    if (entry.source) chips.push(`<span class="tj-log-chip tj-log-chip-debug">SRC ${escapeHtml(entry.source)}</span>`);
    if (entry.tech) chips.push(`<span class="tj-log-chip tj-log-chip-debug">CTX ${escapeHtml(entry.tech)}</span>`);

    let html = `<div class="tj-log-card tj-log-card-${escapeHtml(chipType)}">`;
    html += `<div class="tj-log-head">${chips.join('')}</div>`;
    html += `<div class="tj-log-message">${escapeHtml(entry.msg)}</div>`;
    if (entry.details) html += `<pre class="tj-log-details">${escapeHtml(entry.details)}</pre>`;
    html += `</div>`;
    return html;
  }

  function toPlainTextEntry(entry) {
    const normalized = normalize(entry);
    const bits = [`[${formatTime(normalized.timestamp)}]`, `[${normalized.type.toUpperCase()}]`];
    if (normalized.source) bits.push(`[SRC:${normalized.source}]`);
    if (normalized.tech) bits.push(`[CTX:${normalized.tech}]`);
    bits.push(normalized.msg);
    if (normalized.details) bits.push(`\n${normalized.details}`);
    return bits.join(' ');
  }

  function toPlainText(logs) {
    if (!Array.isArray(logs)) return '';
    return logs.map(toPlainTextEntry).join('\n');
  }

  function append(container, payload, fallback = {}) {
    if (!container) return null;
    injectStyles();
    const entry = normalize(payload, fallback);
    const node = document.createElement('div');
    node.innerHTML = render(entry);
    container.appendChild(node.firstElementChild);
    return entry;
  }

  window.extrajudTerminalLogger = { normalize, render, append, toPlainTextEntry, toPlainText };
})();
