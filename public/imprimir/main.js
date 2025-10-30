// main-page.js
import { LitElement, html, css } from 'lit';
import './usuarios-page.js';
import './historial-agente.js';
import './enviar-comando.js';
import './imprimir-pdf.js';

class MainPage extends LitElement {
  static properties = {
    selectedAgent: { state: true },
    baseUrl: { type: String },
    apiKey:  { type: String },
  };

  static styles = css`
    :host { display:block; color:#e8f0fe; font:14px ui-sans-serif, system-ui, Arial; }
    .grid { display:grid; grid-template-columns: 1fr; gap:14px; }
    @media (min-width: 980px) { .grid { grid-template-columns: 1fr 1fr; } }
    h1 { margin:0 0 8px; }
    .card { background:#11131a; border:1px solid #232735; border-radius:12px; padding:14px; }
    .muted { color:#9fb0ff; font-size:12px; }
    .pill { font-size:11px; border:1px solid #2b3145; padding:2px 8px; border-radius:999px; }
  `;

  constructor() {
    super();
    this.selectedAgent = null;
    this.baseUrl = 'http://localhost:3000';
    this.apiKey = '';
  }

  connectedCallback() {
    super.connectedCallback();
    let t;
    this._onHistoryRefresh = (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        const agentId = e.detail?.agentId;
        const hist = this.renderRoot?.querySelector('historial-agente');
        if (hist && (!hist.agentId || hist.agentId === agentId)) {
          hist.loadHistory?.();
        }
      }, 1200); // pequeño margen para que el backend persista
    };
    this.addEventListener('agent-history-refresh', this._onHistoryRefresh);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('agent-history-refresh', this._onHistoryRefresh);
  }

  _onAgentSelect = (e) => {
    this.selectedAgent = e.detail.agent || null;
  };

  render() {
    const a = this.selectedAgent;
    return html`
      <h1>Panel de Agentes</h1>
      <div class="grid">
        <!-- Lista y selección de agentes -->
        <div class="card">
          <h2>Agentes</h2>
          <usuarios-page
            .baseUrl=${this.baseUrl}
            .apiKey=${this.apiKey}
            @agent-select=${this._onAgentSelect}
          ></usuarios-page>
        </div>

        <!-- Columna derecha -->
        <div>
          <!-- Imprimir PDF: sube y manda comando -->
          <imprimir-pdf
            .baseUrl=${this.baseUrl}
            .apiKey=${this.apiKey}
            .agentId=${a?.id || ''}
            uploadPath="/Archivos/Subir"
            printPath="/Imprimir/"
            engine="sumatra"
            exePath=""
            printer=""
            .copies=${1}
            pages="">
          </imprimir-pdf>

          <!-- Enviar comando manual -->
          <enviar-comando
            .baseUrl=${this.baseUrl}
            .apiKey=${this.apiKey}
            .agentId=${a?.id || ''}
            endpointPath="/Imprimir/">
          </enviar-comando>

          <!-- Historial del agente (GET /Imprimir/historial/{agentId}) -->
          <historial-agente
            .baseUrl=${this.baseUrl}
            .apiKey=${this.apiKey}
            .agentId=${a?.id || ''}
            endpointPath="/Imprimir/historial"
            .limit=${50}
            filter="all"
            .autoRefresh=${false}>
          </historial-agente>

          <!-- Panel compacto -->
          <div class="card" style="margin-top:14px">
            <h2>Usuario seleccionado</h2>
            ${a ? html`
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <div>
                  <div><strong>${a.id || '(sin id)'}</strong></div>
                  <div class="muted">${a.sistema || '—'}</div>
                  ${a.pendientes != null ? html`<div class="pill">Pendientes: ${a.pendientes}</div>` : null}
                </div>
                <div>
                  <div><strong>Equipo/IP:</strong> ${a.nombre || '—'} / ${a.ip || '—'}</div>
                  <div><strong>Navegador:</strong> ${a.navegador || '—'}</div>
                  <div><strong>Último contacto:</strong> ${a.ultimaConexion ? new Date(a.ultimaConexion).toLocaleString() : '—'}</div>
                </div>
              </div>
            ` : html`<div class="muted">Elige un agente en la tabla de la izquierda.</div>`}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('main-page', MainPage);
