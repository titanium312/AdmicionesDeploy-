// enviar-comando.js
import { LitElement, html, css } from 'lit';

export class EnviarComando extends LitElement {
 static properties = {
    agentId: { type: String },
    baseUrl: { type: String },        // ej: http://localhost:3000
    apiKey:  { type: String },        // opcional (x-api-key)
    endpointPath: { type: String },   // por defecto: /Imprimir/
    _loading: { state: true },
    _result:  { state: true },
    _error:   { state: true },
  };

  static styles = css`
    :host { display:block; font:14px ui-sans-serif, system-ui, Arial; color:#e8f0fe; }
    .card { background:#11131a; border:1px solid #232735; border-radius:12px; padding:14px; }
    h3 { margin:0 0 10px; font-size:16px; }
    .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:10px 0; }
    textarea, button {
      font: inherit; padding:8px 10px; border-radius:8px; border:1px solid #2b3145; background:#0e1118; color:#e8f0fe;
    }
    textarea { width:100%; min-height:90px; resize:vertical; }
    button { background:#3b82f6; border:none; cursor:pointer; }
    button:disabled { opacity:.5; cursor:default; }
    pre { background:#0e1118; padding:8px; border-radius:8px; overflow:auto; }
    .muted { color:#9fb0ff; font-size:12px; }
  `;

  constructor() {
    super();
    this.agentId = '';
    this.baseUrl = 'http://localhost:3000';
    this.apiKey = '';
    this.endpointPath = '/Imprimir/'; // << exacto según tu curl
    this._loading = false;
    this._result = null;
    this._error = '';
  }

  _url() {
    const base = (this.baseUrl || '').replace(/\/+$/, '');
    let ep = (this.endpointPath || '/Imprimir/').trim();
    if (!ep.startsWith('/')) ep = '/' + ep;
    return base + ep; // POST a /Imprimir/
  }

  async _send(e) {
    e?.preventDefault?.();
    const ta = this.renderRoot.querySelector('#cmd');
    const comando = ta?.value?.trim() || '';
    if (!this.agentId || !comando) return;

    this._loading = true;
    this._error = '';
    this._result = null;

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
      };
      const body = JSON.stringify({ agentId: this.agentId, comando });

      const res = await fetch(this._url(), { method: 'POST', headers, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || res.statusText);

      this._result = json;
      // Notifica para refrescar historial
      this.dispatchEvent(new CustomEvent('agent-history-refresh', {
        bubbles: true, composed: true,
        detail: { agentId: this.agentId }
      }));
    } catch (err) {
      this._error = err?.message || String(err);
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      <div class="card">
        <h3>Enviar comando</h3>
        <div class="muted">Agente: ${this.agentId || '—'}</div>
        <form @submit=${(e)=>this._send(e)}>
          <textarea id="cmd" placeholder='Ej: notepad /p C:\\Users\\User\\Documents\\file.txt'
                    @keydown=${(e)=>{ if(e.ctrlKey && e.key==='Enter') this._send(e); }}></textarea>
          <div class="row">
            <button ?disabled=${this._loading || !this.agentId}>
              ${this._loading ? 'Enviando…' : 'Enviar'}
            </button>
            <span class="muted">Tip: Ctrl+Enter para enviar</span>
          </div>
        </form>

        ${this._error ? html`<div class="muted">Error: ${this._error}</div>` : null}
        ${this._result ? html`
          <div>
            <h4>Respuesta:</h4>
            <pre>${JSON.stringify(this._result, null, 2)}</pre>
          </div>` : null}
      </div>
    `;
  }
}

customElements.define('enviar-comando', EnviarComando);
