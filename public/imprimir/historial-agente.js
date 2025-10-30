// historial-agente.js
import { LitElement, html, css } from 'lit';

export class HistorialAgente extends LitElement {
  static properties = {
    agentId: { type: String },
    baseUrl: { type: String },
    apiKey:  { type: String },
    endpointPath: { type: String },   // admite {agentId} o path param
    limit:   { type: Number },
    onlyLast:{ type: Boolean, attribute: 'only-last' },
    filter:  { type: String },        // 'all' | 'commands' | 'outputs'
    autoRefresh: { type: Boolean, attribute: 'auto-refresh' },

    _items:  { state: true },
    _loading:{ state: true },
    _error:  { state: true },
  };

  static styles = css`
    :host { display:block; font:14px ui-sans-serif, system-ui, Arial; color:#e8f0fe; }
    .card { background:#11131a; border:1px solid #232735; border-radius:12px; padding:14px; }
    h3 { margin:0 0 10px; font-size:16px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; align-items:center; }
    input, button, select {
      font: inherit; padding:8px 10px; border-radius:8px; border:1px solid #2b3145; background:#0e1118; color:#e8f0fe;
    }
    button { background:#3b82f6; border:none; cursor:pointer; }
    button.ghost { background:#1f2937; }
    .muted { color:#9fb0ff; font-size:12px; }
    table { width:100%; border-collapse:collapse; }
    th, td { border-top:1px solid #232735; padding:8px; text-align:left; vertical-align:top; }
    tr:hover { background:#0e1118; }
    pre { margin:0; white-space:pre-wrap; word-wrap:break-word; font:12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .right { text-align:right; }
    .pill { font-size:11px; border:1px solid #2b3145; padding:2px 8px; border-radius:999px; }
  `;

  constructor() {
    super();
    this.agentId = '';
    this.baseUrl = 'http://localhost:3000';
    this.apiKey = '';
    // NUEVO: por defecto, usa placeholder {agentId}
    this.endpointPath = '/Imprimir/historial/{agentId}';
    this.limit = 50;
    this.onlyLast = false;
    this.filter = 'all';
    this.autoRefresh = false;

    this._items = [];
    this._loading = false;
    this._error = '';
    this._timer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._listenAgentSelect = (e) => {
      if (!this.hasAttribute('agentid')) {
        this.agentId = e.detail?.agentId || '';
      }
      this.loadHistory();
    };
    this.addEventListener('agent-select', this._listenAgentSelect);
    this._setupAuto();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('agent-select', this._listenAgentSelect);
    if (this._timer) clearInterval(this._timer);
  }

  updated(changed) {
    if (changed.has('agentId') || changed.has('baseUrl') || changed.has('endpointPath')) {
      this.loadHistory();
    }
    if (changed.has('autoRefresh')) this._setupAuto();
  }

  _setupAuto() {
    if (this._timer) clearInterval(this._timer);
    if (this.autoRefresh) {
      this._timer = setInterval(() => this.loadHistory(), 3000);
    }
  }

  // *** Actualizado para soportar path param ***
  _url() {
    const base = (this.baseUrl?.replace(/\/+$/,'') || '');
    let ep = (this.endpointPath?.trim() || '');

    if (!ep.startsWith('/')) ep = '/' + ep;

    // Si tenemos agentId, intentamos las variantes de path param
    if (this.agentId) {
      const id = encodeURIComponent(this.agentId);

      if (ep.includes('{agentId}')) {
        ep = ep.replace('{agentId}', id);
      } else if (/\/$/.test(ep)) {
        ep = ep + id;                         // .../historial/  -> .../historial/AGENTE_1
      } else if (!ep.includes('?')) {
        ep = `${ep}/${id}`;                   // .../historial   -> .../historial/AGENTE_1
      } else {
        // Si trae query en endpointPath, agregamos agentId como query extra
        const sep = ep.includes('?') ? '&' : '?';
        ep = `${ep}${sep}agentId=${id}`;
      }
    }

    // Fallback: si no se pudo inyectar y hay agentId, añadimos query
    if (this.agentId && !ep.includes(this.agentId) && !/[?&]agentId=/.test(ep)) {
      const sep = ep.includes('?') ? '&' : '?';
      ep = `${ep}${sep}agentId=${encodeURIComponent(this.agentId)}`;
    }

    return `${base}${ep}`;
  }

  async loadHistory() {
    if (!this.agentId) return;
    try {
      this._loading = true;
      this._error = '';
      const headers = this.apiKey ? { 'x-api-key': this.apiKey } : {};
      const url = this._url();
      const res = await fetch(url, { headers });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch {}
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}\n${body || ''}`);
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];

      // Ordena por fecha ascendente si viene
      arr.sort((a, b) => new Date(a.fecha || a.timestamp || 0) - new Date(b.fecha || b.timestamp || 0));

      let list = arr;
      if (this.onlyLast && arr.length) list = [arr[arr.length - 1]];
      if (this.limit > 0) list = list.slice(-this.limit);
      this._items = list;
    } catch (e) {
      this._error = e?.message || String(e);
      console.error(e);
    } finally {
      this._loading = false;
    }
  }

  _copy(text) {
    navigator.clipboard?.writeText(String(text || ''))?.catch(()=>{});
  }

  _filterItems() {
    if (this.filter === 'commands') {
      return this._items.map(x => ({ comando: x.comando, fecha: x.fecha || x.timestamp }));
    }
    if (this.filter === 'outputs') {
      return this._items.map(x => ({ salida: x.salida, fecha: x.fecha || x.timestamp }));
    }
    return this._items;
  }

  render() {
    const items = this._filterItems();
    return html`
      <div class="card">
        <h3>Historial del agente</h3>
        <div class="row">
          <span class="pill">Agente: ${this.agentId || '—'}</span>
          <select @change=${e => { this.filter = e.target.value; }}>
            <option value="all" ?selected=${this.filter==='all'}>Todo</option>
            <option value="commands" ?selected=${this.filter==='commands'}>Solo comandos</option>
            <option value="outputs" ?selected=${this.filter==='outputs'}>Solo salidas</option>
          </select>
          <label class="row">
            <input type="checkbox" .checked=${this.onlyLast} @change=${e => { this.onlyLast = e.target.checked; this.loadHistory(); }} />
            Solo último
          </label>
          <label class="row">
            Límite:
            <input style="width:80px" type="number" min="0" .value=${String(this.limit)}
                   @change=${e => { this.limit = Number(e.target.value||0); this.loadHistory(); }} />
          </label>
          <button class="ghost" @click=${this.loadHistory}>Refrescar</button>
          <button class="ghost" @click=${() => { this.autoRefresh = !this.autoRefresh; }}>
            Auto: ${this.autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>

        ${this._loading ? html`<div class="muted">Cargando…</div>` : null}
        ${this._error ? html`<div class="muted">Error: ${this._error}</div>` : null}

        ${!this.agentId ? html`<div class="muted">Elige un agente para ver su historial.</div>` : null}

        ${items?.length
          ? html`
              <table>
                <thead>
                  <tr>
                    <th style="width:180px">Fecha</th>
                    ${this.filter !== 'outputs' ? html`<th>Comando</th>` : null}
                    ${this.filter !== 'commands' ? html`<th>Salida</th>` : null}
                    <th class="right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((x) => {
                    const fecha = x.fecha || x.timestamp;
                    const fechaTxt = fecha ? new Date(fecha).toLocaleString() : '—';
                    const comando = x.comando ?? '';
                    const salida = x.salida ?? '';
                    return html`
                      <tr>
                        <td>${fechaTxt}</td>
                        ${this.filter !== 'outputs' ? html`<td><pre>${comando || '—'}</pre></td>` : null}
                        ${this.filter !== 'commands' ? html`<td><pre>${(typeof salida === 'object') ? JSON.stringify(salida, null, 2) : (salida || '—')}</pre></td>` : null}
                        <td class="right">
                          ${this.filter !== 'outputs'
                            ? html`<button @click=${() => this._copy(comando)}>Copiar cmd</button>` : null}
                          ${this.filter !== 'commands'
                            ? html`<button @click=${() => this._copy((typeof salida === 'object') ? JSON.stringify(salida) : salida)}>Copiar salida</button>` : null}
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              </table>
            `
          : (!this._loading && this.agentId) ? html`<div class="muted">No hay historial aún.</div>` : null
        }
      </div>
    `;
  }
}

customElements.define('historial-agente', HistorialAgente);
