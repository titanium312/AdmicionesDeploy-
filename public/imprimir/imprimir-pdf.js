// imprimir-pdf.js
import { LitElement, html, css } from 'lit';

const ENGINES = {
  // Requiere Adobe Acrobat Reader instalado
  // /t -> imprime y cierra, opcionalmente puedes incluir "printer" "driver" "port"
  // Si no das impresora, usa la predeterminada
  acrobat: {
    label: 'Adobe Reader (AcroRd32.exe)',
    buildCmd: ({ exePath, filePath, printer }) => {
      const exe = exePath || 'C:\\Program Files (x86)\\Adobe\\Acrobat Reader\\Reader\\AcroRd32.exe';
      // AcroRd es quisquilloso con comillas; usa /t "file" "printer"
      return `"${exe}" /t "${filePath}"${printer ? ` "${printer}"` : ''}`;
    }
  },

  // Muy recomendado por su CLI
  // https://www.sumatrapdfreader.org/docs/Command-line-arguments
  sumatra: {
    label: 'SumatraPDF',
    buildCmd: ({ exePath, filePath, printer, copies, pages }) => {
      const exe = exePath || 'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe';
      const settings = [];
      if (copies && Number(copies) > 1) settings.push(`copies=${Number(copies)}`);
      // Páginas: Sumatra usa -print-to-default o -print-to "Printer"
      // y -print-settings "page-range:1-3"
      if (pages) settings.push(`page-range:${pages}`);
      const settingsStr = settings.length ? ` -print-settings "${settings.join(',')}"` : '';
      if (printer) {
        return `"${exe}" -print-to "${printer}"${settingsStr} "${filePath}"`;
      }
      return `"${exe}" -print-to-default${settingsStr} "${filePath}"`;
    }
  },

  // Usa Edge para imprimir en segundo plano (revisar versión)
  // Soporta /p o /print; /p abre diálogo en algunas versiones. /print intenta silencioso.
  edge: {
    label: 'Microsoft Edge',
    buildCmd: ({ exePath, filePath, printer }) => {
      const exe = exePath || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
      // Edge no siempre permite elegir impresora por CLI. Se usa predeterminada.
      // Puedes configurar impresora predeterminada en el PC del agente.
      return `"${exe}" --headless=print --print-to-pdf-no-header "${filePath}"${printer ? ` --printer-name="${printer}"` : ''}`;
    }
  }
};

export class ImprimirPdf extends LitElement {
  static properties = {
    agentId: { type: String },
    baseUrl: { type: String },
    apiKey:  { type: String },

    uploadPath: { type: String }, // POST multipart -> { path | filePath | ruta | ... }
    printPath:  { type: String }, // POST JSON { agentId, comando }

    // Motor y ruta del ejecutable
    engine:   { type: String },    // 'sumatra' | 'acrobat' | 'edge'
    exePath:  { type: String },    // si lo dejas vacío, usa el default sugerido
    printer:  { type: String },    // nombre de impresora Windows (opcional)
    copies:   { type: Number },    // copias (solo Sumatra respeta por CLI)
    pages:    { type: String },    // rangos: "1-3,5" (solo Sumatra soporta bien)

    _loading: { state: true },
    _step:    { state: true },
    _result:  { state: true },
    _error:   { state: true },
    _uploadedMeta: { state: true },
  };

  static styles = css`
    :host { display:block; color:#e8f0fe; font:14px ui-sans-serif, system-ui, Arial; }
    .card { background:#11131a; border:1px solid #232735; border-radius:12px; padding:14px; }
    .row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin:10px 0; }
    input, button, select {
      font: inherit; padding:8px 10px; border-radius:8px; border:1px solid #2b3145;
      background:#0e1118; color:#e8f0fe;
    }
    input[type="file"] { padding:6px; }
    button { background:#3b82f6; border:none; cursor:pointer; }
    button:disabled { opacity:.5; cursor:default; }
    .muted { color:#9fb0ff; font-size:12px; }
    .grid { display:grid; gap:8px; grid-template-columns: 1fr; }
    @media (min-width: 760px) { .grid { grid-template-columns: 1fr 1fr; } }
    .ok { color:#34d399; }
    .err { color:#f87171; }
    pre { background:#0e1118; padding:8px; border-radius:8px; overflow:auto; }
  `;

  constructor() {
    super();
    this.agentId = '';
    this.baseUrl = 'http://localhost:3000';
    this.apiKey = '';
    this.uploadPath = '/Archivos/Subir';
    this.printPath  = '/Imprimir/';

    // Por defecto recomiendo Sumatra por su CLI fiable
    this.engine  = 'sumatra'; // 'sumatra' | 'acrobat' | 'edge'
    this.exePath = '';        // deja vacío para usar el default del motor
    this.printer = '';        // si vacío -> impresora predeterminada
    this.copies  = 1;
    this.pages   = '';        // ej "1-3,5"

    this._loading = false;
    this._step = 'idle';
    this._result = null;
    this._error = '';
    this._uploadedMeta = null;
  }

  _base() { return (this.baseUrl || '').replace(/\/+$/, ''); }

  _headers(extra = {}) {
    return {
      ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
      ...extra,
    };
  }

  extractPath(uploadResponseJson) {
    return (
      uploadResponseJson?.path ||
      uploadResponseJson?.filePath ||
      uploadResponseJson?.ruta ||
      uploadResponseJson?.fullpath ||
      uploadResponseJson?.absolutePath ||
      uploadResponseJson?.localPath ||
      null
    );
  }

  async _upload(file) {
    const form = new FormData();
    form.append('file', file, file.name);
    const res = await fetch(this._base() + this.uploadPath, {
      method: 'POST',
      headers: this._headers(),
      body: form,
    });
    const json = await res.json().catch(()=> ({}));
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json;
  }

  buildCommand(filePathWin) {
    const engine = ENGINES[this.engine] || ENGINES.sumatra;
    // Asegurar dobles backslashes en el JSON (no en el shell final, el agente lo ejecutará)
    const fp = String(filePathWin).replace(/\\/g, '\\\\');
    const cmd = engine.buildCmd({
      exePath: this.exePath,
      filePath: fp,
      printer: this.printer,
      copies: this.copies,
      pages: this.pages?.trim() || ''
    });
    return cmd;
  }

  async _print(filePathWin) {
    const comando = this.buildCommand(filePathWin);
    const res = await fetch(this._base() + this.printPath, {
      method: 'POST',
      headers: this._headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ agentId: this.agentId, comando }),
    });
    const json = await res.json().catch(()=> ({}));
    if (!res.ok) throw new Error(json?.error || res.statusText);
    return json;
  }

  async _handle(e) {
    e?.preventDefault?.();
    this._error = '';
    this._result = null;
    this._uploadedMeta = null;

    const input = this.renderRoot.querySelector('#pdf');
    const file = input?.files?.[0];

    if (!this.agentId) { this._error = 'Selecciona un agente.'; return; }
    if (!file) { this._error = 'Selecciona un PDF.'; return; }
    if (file.type !== 'application/pdf') { this._error = 'Solo PDF por ahora.'; return; }

    try {
      this._loading = true;
      this._step = 'uploading';

      const up = await this._upload(file);
      this._uploadedMeta = up;
      const path = this.extractPath(up);
      if (!path) throw new Error('El endpoint de subida no devolvió una ruta válida.');

      this._step = 'printing';
      const printed = await this._print(path);
      this._result = printed;
      this._step = 'done';

      // refrescar historial
      this.dispatchEvent(new CustomEvent('agent-history-refresh', {
        bubbles: true, composed: true,
        detail: { agentId: this.agentId }
      }));
    } catch (err) {
      this._error = err?.message || String(err);
      this._step = 'error';
    } finally {
      this._loading = false;
    }
  }

  render() {
    return html`
      <div class="card">
        <h3>Imprimir PDF</h3>
        <div class="muted">Agente: ${this.agentId || '—'}</div>

        <div class="row">
          <input id="pdf" type="file" accept="application/pdf" />
          <button ?disabled=${this._loading || !this.agentId} @click=${this._handle}>
            ${this._loading
              ? (this._step === 'uploading' ? 'Subiendo…' :
                 this._step === 'printing'  ? 'Imprimiendo…' : 'Procesando…')
              : 'Imprimir'}
          </button>
        </div>

        <div class="grid">
          <label>Motor:
            <select .value=${this.engine} @change=${e=> this.engine = e.target.value}>
              ${Object.entries(ENGINES).map(([k,v]) => html`<option value=${k}>${v.label}</option>`)}
            </select>
          </label>

          <label>Ruta ejecutable (opcional):
            <input .value=${this.exePath} @input=${e=> this.exePath = e.target.value}
                   placeholder='C:\\Program Files\\SumatraPDF\\SumatraPDF.exe' />
          </label>

          <label>Impresora (opcional):
            <input .value=${this.printer} @input=${e=> this.printer = e.target.value}
                   placeholder='Nombre_impresora_windows' />
          </label>

          <label>Copias (Sumatra):
            <input type="number" min="1" value=${String(this.copies)}
                   @input=${e=> this.copies = Number(e.target.value || 1)} />
          </label>

          <label>Páginas (Sumatra, ej 1-3,5):
            <input .value=${this.pages} @input=${e=> this.pages = e.target.value} />
          </label>
        </div>

        ${this._error ? html`<div class="err">Error: ${this._error}</div>` : null}

        ${this._uploadedMeta ? html`
          <div class="muted">Subido como:
            <pre>${JSON.stringify(this._uploadedMeta, null, 2)}</pre>
          </div>` : null}

        ${this._result ? html`
          <div class="ok">Impresión enviada:</div>
          <pre>${JSON.stringify(this._result, null, 2)}</pre>` : null}
      </div>
    `;
  }
}

customElements.define('imprimir-pdf', ImprimirPdf);
