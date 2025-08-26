import { LitElement, html, css } from 'lit';
import { generateBat } from './bat/batGenerator.js';

export class BotonComponente extends LitElement {
  static properties = {
    data: { type: Array },
    groupBy: { type: String },
    basePath: { type: String },
    disabled: { type: Boolean },
    filename: { type: String },
    _batContent: { state: true },
    _busy: { state: true },
    mainFolderName: { type: String },
  };

  static styles = css`
    :host { display: block; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    button {
      padding: 0.6em 1.1em;
      border: none;
      border-radius: 8px;
      background: var(--color-primary, #2563eb);
      color: white;
      font-weight: 700;
      cursor: pointer;
      transition: transform .05s ease, opacity .2s ease, background .2s ease;
    }
    button:hover { transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:disabled { background: #9ca3af; cursor: not-allowed; opacity: .8; }
    .row { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; margin: .5rem 0 0.2rem; }
    .muted { color: #6b7280; font-size: .85rem; }
    pre {
      background: #0b1020;
      color: #e5e7eb;
      padding: 12px;
      border-radius: 8px;
      font-size: 12.5px;
      line-height: 1.35;
      overflow: auto;
      max-height: 420px;
    }
    .tag { background:#eef2ff; color:#3730a3; padding:.2rem .5rem; border-radius:999px; font-size:.75rem; }
    .config-section { 
      background: #f9fafb; 
      padding: 12px; 
      border-radius: 8px; 
      margin: 12px 0; 
      border: 1px solid #e5e7eb;
    }
    label { display: block; margin-bottom: 8px; font-weight: 500; }
    input { 
      padding: 8px 12px; 
      border: 1px solid #d1d5db; 
      border-radius: 6px; 
      width: 100%; 
      box-sizing: border-box;
    }
  `;

  constructor() {
    super();
    this.data = [];
    this.groupBy = 'numeroAdmision';
    this.basePath = '';
    this.disabled = false;
    this.filename = 'descargar_documentos.bat';
    this._batContent = '';
    this._busy = false;
    this.mainFolderName = 'Documentos_Descargados';
  }

  async _handleGenerate() {
    this._busy = true;
    this._batContent = '';
    try {
      this._batContent = await generateBat(
        this.data,
        {
          groupBy: this.groupBy,
          basePath: this.basePath,
          mainFolderName: this.mainFolderName,
        },
        // fetch inyectable (usa global fetch por defecto si existe)
        typeof fetch !== 'undefined' ? fetch : null
      );
    } catch (err) {
      this._batContent = `REM Error generando BAT: ${err?.message || err}`;
    } finally {
      this._busy = false;
    }
  }

  _downloadBat() {
    if (!this._batContent) return;
    const blob = new Blob([this._batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename || 'descargar_documentos.bat';
    a.click();
    URL.revokeObjectURL(url);
  }

  _handleMainFolderChange(e) {
    this.mainFolderName = e.target.value || 'Documentos_Descargados';
  }

  render() {
    const total = Array.isArray(this.data) ? this.data.length : 0;
    return html`
      <div class="config-section">
        <label for="mainFolderName">Nombre de la carpeta principal:</label>
        <input 
          type="text" 
          id="mainFolderName" 
          .value=${this.mainFolderName}
          @change=${this._handleMainFolderChange}
          placeholder="Nombre de la carpeta principal"
        />
      </div>
      
      <div class="row">
        <button
          @click=${this._handleGenerate}
          ?disabled=${this.disabled || this._busy}
          title="Generar .bat con todas las admisiones/facturas"
        >
          ${this._busy ? '⌛ Generando...' : '🚀 Procesar Archivos'}
        </button>

        <button
          @click=${this._downloadBat}
          ?disabled=${!this._batContent}
          title="Descargar el último .bat generado"
          style="background:#10b981"
        >
          ⬇️ Descargar BAT
        </button>

        <span class="tag">items: ${total}</span>
        ${this.basePath
          ? html`<span class="tag" title="Carpeta base de destino">basePath: ${this.basePath}</span>`
          : html`<span class="tag" title="Sin ruta base, usa directorio actual">sin basePath</span>`}
        <span class="tag">groupBy: ${this.groupBy}</span>
        <span class="tag">carpeta: ${this.mainFolderName}</span>
      </div>

      ${!this._batContent
        ? html`<p class="muted">(sin script aún — haz clic en "Procesar Archivos")</p>`
        : html`<pre>${this._batContent}</pre>`}
    `;
  }
}

customElements.define('boton-componente', BotonComponente);
