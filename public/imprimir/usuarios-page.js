// usuarios-page.js
import { LitElement, html, css } from 'lit';

export class UsuariosPage extends LitElement {
  static properties = {
    baseUrl: { type: String },       // ej: http://localhost:3000
    apiKey:  { type: String },       // opcional
    _agents: { state: true },
    _loading:{ state: true },
    _error:  { state: true },
    selectedId: { type: String },    // seleccionado actual
    autoRefresh: { type: Boolean }   // auto refresco opcional
  };

  static styles = css`
    :host { display:block; font: 14px ui-sans-serif, system-ui, Arial; color:#e8f0fe; }
    .card { background:#11131a; border:1px solid #232735; border-radius:12px; padding:14px; }
    h3 { margin:0 0 10px; font-size:16px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
    input, button, select {
      font: inherit; padding:8px 10px; border-radius:8px; border:1px solid #2b3145; background:#0e1118; color:#e8f0fe;
    }
    button { background:#3b82f6; border:none; cursor:pointer; }
    button.ghost { background:#1f2937; }
    table { width:100%; border-collapse:collapse; }
    th, td { border-top:1px solid #232735; padding:8px; text-align:left; vertical-align:top; }
    tr:hover { background:#0e1118; }
    .muted { color:#9fb0ff; font-size:12px; }
    .selected { outline:2px solid #3b82f6; outline-offset:-2px; }
    .right { text-align:right; }
    .pill { font-size:11px; border:1px solid #2b3145; padding:2px 8px; border-radius:999px; }
  `;

  constructor() {
    super();
    this.baseUrl = 'http://localhost:3000';
    this.apiKey = '';
    this._agents = [];
    this._loading = false;
    this._error = '';
    this.selectedId = '';
    this.autoRefresh = false;
    this._timer = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this.loadAgents();
    this._setupAuto();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._timer) clearInterval(this._timer);
  }

  _setupAuto() {
    if (this._timer) clearInterval(this._timer);
    if (this.autoRefresh) {
      this._timer = setInterval(() => this.loadAgents(), 3000);
    }
  }

  async loadAgents() {
    try {
      this._loading = true;
      this._error = '';
      const url = this.baseUrl.replace(/\/+$/,'') + '/Imprimir/agentes';
      const headers = this.apiKey ? { 'x-api-key': this.apiKey } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normaliza claves típicas
      const list = Array.isArray(data) ? data.map(a => ({
        id: a.id || a.agentId || a.AGENT_ID || '',
        nombre: a.nombre || a.hostname || a.AGENT_NAME || '',
        ip: a.ip ?? '',
        sistema: a.sistema ?? '',
        ultimaConexion: a.ultimaConexion || a.lastSeen || '',
        navegador: a.navegador || a.userAgent || '',
        pendientes: a.pendientes ?? a.pending ?? null
      })) : [];
      this._agents = list;
      // Si no hay seleccionado y hay agentes, selecciona el primero
      if (!this.selectedId && list.length) this._onSelect(list[0].id);
    } catch (e) {
      this._error = e?.message || String(e);
    } finally {
      this._loading = false;
    }
  }

  _onSelect(id) {
    this.selectedId = id;
    const agent = this._agents.find(a => a.id === id) || null;
    // Emite evento para el padre
    this.dispatchEvent(new CustomEvent('agent-select', {
      detail: { agentId: id, agent },
      bubbles: true,
      composed: true
    }));
    this.requestUpdate();
  }

  _toggleAuto() {
    this.autoRefresh = !this.autoRefresh;
    this._setupAuto();
  }

  render() {
    return html`
      <div class="card">
        <h3>Receptores / Agentes</h3>
        <div class="row">
          <input placeholder="http://localhost:3000" .value=${this.baseUrl}
                 @change=${e => { this.baseUrl = e.target.value; }} />
          <input placeholder="x-api-key (opcional)" .value=${this.apiKey}
                 @change=${e => { this.apiKey = e.target.value; }} />
          <button class="ghost" @click=${this.loadAgents}>Refrescar</button>
          <button class="ghost" @click=${this._toggleAuto}>
            Auto: ${this.autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>

        ${this._loading ? html`<div class="muted">Cargando…</div>` : null}
        ${this._error ? html`<div class="muted">Error: ${this._error}</div>` : null}

        ${this._agents?.length
          ? html`
              <table>
                <thead>
                  <tr>
                    <th>Agente</th>
                    <th>Equipo / IP</th>
                    <th>Último contacto</th>
                    <th class="right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                ${this._agents.map(a => html`
                  <tr class=${this.selectedId === a.id ? 'selected' : ''}>
                    <td>
                      <div><strong>${a.id || '(sin id)'}</strong></div>
                      <div class="muted">${a.sistema || ''}</div>
                      ${a.pendientes != null
                        ? html`<div class="pill">Pendientes: ${a.pendientes}</div>` : null}
                    </td>
                    <td>
                      <div>${a.nombre || '—'}</div>
                      <div class="muted">${a.ip || '—'}</div>
                    </td>
                    <td>
                      <div>${a.ultimaConexion ? new Date(a.ultimaConexion).toLocaleString() : '—'}</div>
                      <div class="muted">${a.navegador || '—'}</div>
                    </td>
                    <td class="right">
                      <button @click=${() => this._onSelect(a.id)}>Elegir</button>
                    </td>
                  </tr>
                `)}
                </tbody>
              </table>
            `
          : html`<div class="muted">No hay agentes registrados aún.</div>`
        }
      </div>
    `;
  }
}

customElements.define('usuarios-page', UsuariosPage);
