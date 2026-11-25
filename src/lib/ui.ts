// Helpers compartidos por los scripts de cliente de las paginas.

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function money(n: number | string, currency = 'MXN'): string {
  return Number(n).toLocaleString('es-MX', { style: 'currency', currency, minimumFractionDigits: 2 });
}

export function int(n: number | string): string {
  return Number(n).toLocaleString('es-MX');
}

export function dateTime(d: string | Date): string {
  return new Date(d).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function toast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export const icons = {
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8m18 0v8l-9 5m9-13-9 5m0 8V13m0 8-9-5V8l9 5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 4 3 8m4-4 4 4m6 12V4m0 16 4-4m-4 4-4-4"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 5v6m4-6v6"/></svg>',
};

export function stateHtml(kind: 'empty' | 'error', title: string, text = ''): string {
  const icon = kind === 'error' ? icons.alert : icons.box;
  return `<div class="state"><div class="state-icon${kind === 'error' ? ' danger' : ''}">${icon}</div>` +
    `<div class="state-title">${esc(title)}</div>${text ? `<div class="state-text">${esc(text)}</div>` : ''}</div>`;
}

export function skeletonRows(cols: number, rows = 6): string {
  let html = '';
  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    for (let c = 0; c < cols; c++) {
      const w = 40 + ((r * 7 + c * 13) % 50);
      html += `<td><span class="skeleton" style="width:${w}%"></span></td>`;
    }
    html += '</tr>';
  }
  return html;
}
