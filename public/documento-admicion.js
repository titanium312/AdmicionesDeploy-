import { LitElement, html, css } from 'lit';
import { BASE_URL, apiFetch } from './api.js'; // de acá sacas la URL base

// Endpoint unificado
const DESCARGA_URL = `${BASE_URL}/descargar`;

// Mapeo con nombres legibles para el usuario
const TIPOS = [
  { code: 'HT',   name: 'Historia Clínica' },
  { code: 'ANX',  name: 'Anexo 2' },
  { code: 'EPI',  name: 'Epicrisis' },
  { code: 'EVL',  name: 'Evolución' },
  { code: 'ENF',  name: 'Notas de Enfermería' },
  { code: 'ADM',  name: 'Admisiones' },
  { code: 'PREF', name: 'Prefacturas' },
  { code: 'OM',   name: 'Órdenes Médicas' },
  { code: 'HAP',  name: 'Hoja Adm. de Procedimientos' },
  { code: 'HMD',  name: 'Hoja Adm. de Medicamentos' },
  { code: 'HGA',  name: 'Hoja de Gastos/Artículos' },
  { code: 'HAA',  name: 'Historia Asistencial' },
];

export class AdmicionesArchivos extends LitElement {
  static properties = {
    loginData: { type: Object },
    numeros: { type: String },
    eps: { type: String },
    modalidad: { type: String },         // evento | capita
    incluirFactura: { type: Boolean },

    // selección de tipos
    tiposSeleccionados: { type: Array }, // array de códigos
    usarTodos: { type: Boolean },

    // estado
    _cargando: { type: Boolean, state: true },
    _pct: { type: Number, state: true },
    _msg: { type: String, state: true },
    _error: { type: String, state: true },
  };

  static styles = css`
    :host {
      all: initial; display: block; box-sizing: border-box; width: 100%;
      --bg:#0a0f1f; --panel:#0f1730; --panel-2:#0d1429; --muted:#9aa6c2; --fg:#e6edf7;
      --primary:#6aa8ff; --primary-2:#98c2ff; --accent:#8b5cf6; --danger:#ef4444;
      font: 14px/1.45 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color: var(--fg); background: var(--bg);
    }
    :host *, :host *::before, :host *::after { box-sizing: inherit; }

    .wrap { max-width: 1280px; width: 100%; margin: 0 auto; padding: 16px; }
    .header { display: grid; gap: 6px; margin-bottom: 12px; }
    .title { margin:0; font-size:22px; font-weight:800; letter-spacing:.2px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      -webkit-background-clip:text; background-clip:text; color:transparent; }
    .subtitle { margin:0; color: var(--muted); }

    .card {
      background: linear-gradient(180deg, var(--panel), var(--panel-2));
      border: 1px solid #1b2545; border-radius: 14px; padding: 14px;
      box-shadow: 0 12px 40px rgba(10,15,31,.35);
    }

    .grid { display: grid; gap: 12px; grid-template-columns: repeat(12, minmax(0,1fr)); }
    .col-4 { grid-column: span 4; } .col-12 { grid-column: 1 / -1; }

    label { display: grid; gap: 6px; font-weight: 700; }
    .help { color: var(--muted); font-weight: 500; font-size: 12px; }
    .err { color: var(--danger); font-weight: 700; }

    textarea, select, input[type="text"] {
      all: unset; width: 100%; border: 1px solid #243159; background: #0e162b; color: var(--fg);
      border-radius: 10px; padding: 10px 12px; font: inherit;
    }
    textarea { min-height: 96px; resize: vertical; }
    select { cursor: pointer; }

    .row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .btn { all: unset; border:1px solid #2a3a6b; background:#0e1b3b; color:#eaf2ff; border-radius:999px;
      padding:10px 14px; cursor:pointer; transition: box-shadow .15s, transform .05s; display:inline-flex; gap:8px; font-weight:900; }
    .btn:hover { box-shadow: 0 10px 28px rgba(106,168,255,.18); }
    .btn:active { transform: translateY(1px); }
    .btn.primary { background: linear-gradient(90deg, var(--primary), var(--accent)); border-color: transparent; color:#0a0f1f; }
    .btn.ghost { background: transparent; }
    .btn:disabled { opacity:.55; cursor:not-allowed; box-shadow:none; transform:none; }

    /* Chips con nombres + código pequeño */
    .chips { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px; }
    .chip {
      all: unset; border:1px solid #2a3a6b; background:#101b3a; color:#eaf2ff; border-radius:12px;
      padding:10px 12px; cursor:pointer; user-select:none; display:flex; align-items:center; justify-content:space-between; gap:10px;
    }
    .chip:hover { border-color:#3a57a6; }
    .chip[aria-pressed="true"] { background:#152a5e; border-color:#456dc9; }
    .chip .name { font-weight:800; letter-spacing:.2px; }
    .chip .code { font-size:12px; opacity:.75; border:1px solid #304378; border-radius:999px; padding:2px 8px; }

    .chip.all { border-style:dashed; justify-content:center; }
    .chip.all .name { font-weight:900; }

    .progress { height:12px; border-radius:999px; overflow:hidden; background:#0f1530; border:1px solid #243159; }
    .bar { height:100%; width:var(--w,0%); background: linear-gradient(90deg, var(--primary), var(--primary-2), var(--accent));
      transition: width .2s ease; }
    .status { display:flex; justify-content:space-between; font-size:12px; color:var(--muted); }

    /* Instrucciones (3 cajitas) */
    .instructions { display:grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap:12px; margin-top:14px; }
    .ibox { grid-column: span 4; background:#0f1730; border:1px solid #1b2545; border-radius:12px; padding:12px; box-shadow:0 8px 24px rgba(11,16,32,.25); display:grid; gap:6px; }
    .ibox h3 { margin:0; font-size:14px; font-weight:900; color:#cfe2ff; }
    .ibox p { margin:0; color: var(--muted); }

    @media (max-width: 1024px) { .col-4 { grid-column: 1/-1; } .ibox { grid-column: 1/-1; } }
  `;

  constructor() {
    super();
    this.loginData = null;
    this.numeros = '';
    this.eps = 'NUEVA_EPS';
    this.modalidad = 'evento';
    this.incluirFactura = true;

    this.tiposSeleccionados = []; // almacenamos códigos
    this.usarTodos = false;

    this._cargando = false;
    this._pct = 0;
    this._msg = '';
    this._error = '';
    this._simTimer = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopSim();
  }

  // ---- helpers ----
  _parseIds() {
    return Array.from(new Set(String(this.numeros || '')
      .split(/[\s,;\n\t]+/).map(s => s.trim()).filter(Boolean)));
  }

  _getTiposParaPayload() {
    if (this.usarTodos) return 'TODO';
    if (this.tiposSeleccionados.length > 0) return this.tiposSeleccionados.join(',');
    // Si no seleccionó nada, mejor avisamos para que no haya dudas
    return '';
  }

  _validar() {
    const ids = this._parseIds();
    const idUser = this.loginData?.usuario?.id_usuario;
    const institucionId = this.loginData?.institucion?.id_institucion;
    const tipos = this._getTiposParaPayload();

    if (!idUser || !institucionId) return { ok:false, msg:'Faltan datos de sesión (usuario/institución).' };
    if (ids.length === 0) return { ok:false, msg:'Ingrese al menos un número de admisión.' };
    if (!tipos) return { ok:false, msg:'Seleccione al menos un tipo o “Todos”.' };
    if (!['evento','capita'].includes(String(this.modalidad))) return { ok:false, msg:'Modalidad inválida.' };

    return { ok:true, ids, idUser, institucionId, tipos };
  }

  // ---- progreso simulado ----
  _startSim(msg='Procesando…') {
    this._cargando = true; this._pct = 0; this._msg = msg; this._stopSim();
    this._simTimer = setInterval(() => {
      const inc = this._pct < 60 ? 6 : this._pct < 85 ? 3 : 1;
      this._pct = Math.min(90, this._pct + inc);
      this.requestUpdate();
    }, 160);
  }
  _finishSim(msg='Listo') { this._msg = msg; this._pct = 100; this._cargando = false; this._stopSim(); }
  _stopSim() { if (this._simTimer) { clearInterval(this._simTimer); this._simTimer = null; } }

  // ---- UI ----
  _toggleChip(code) {
    if (this.usarTodos) this.usarTodos = false; // al tocar chips se apaga "Todos"
    const set = new Set(this.tiposSeleccionados);
    set.has(code) ? set.delete(code) : set.add(code);
    this.tiposSeleccionados = Array.from(set);
  }
  _activarTodos() { this.usarTodos = !this.usarTodos; if (this.usarTodos) this.tiposSeleccionados = []; }

  _limpiar = () => {
    this.numeros = '';
    this.tiposSeleccionados = [];
    this.usarTodos = false;
    this.eps = 'NUEVA_EPS';
    this.modalidad = 'evento';
    this.incluirFactura = true;
    this._error = ''; this._pct = 0; this._msg = '';
  };

  // ---- red ----
  async _descargarBat(e) {
    e?.preventDefault?.();
    if (this._cargando) return;

    this._error = '';
    const val = this._validar();
    if (!val.ok) { this._error = val.msg; return; }

    const { ids, idUser, institucionId, tipos } = val;
    const payload = {
      admisiones: ids,
      institucionId,
      idUser,
      eps: this.eps,
      tipos,                         // "TODO" | "HT,ANX,..." (derivado de la selección)
      modalidad: this.modalidad,     // "evento" | "capita"
      includeFactura: !!this.incluirFactura
    };

    try {
      this._startSim('Generando BAT…');

      // Puedes usar fetch nativo...
      const res = await fetch(DESCARGA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store'
      });

      // ...o tu helper apiFetch si maneja auth/errores de forma centralizada:
      // const res = await apiFetch('/descargar', { method: 'POST', body: payload, asBlob: true });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      this._finishSim('BAT generado');
      this._saveBlob(blob, 'descargas-admisiones.bat');
    } catch (err) {
      this._error = 'No se pudo generar el BAT.';
      this._finishSim('Error');
      console.error('[descargarBat] error', err);
    }
  }

  _saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- render ----
  _renderChips() {
    return html`
      <div class="chips" role="group" aria-label="Tipos de documento">
        ${TIPOS.map(t => html`
          <button
            type="button"
            class="chip"
            aria-pressed=${this.tiposSeleccionados.includes(t.code)}
            title="${t.name} (${t.code})"
            @click=${() => this._toggleChip(t.code)}
          >
            <span class="name">${t.name}</span>
            <span class="code">${t.code}</span>
          </button>
        `)}
        <button
          type="button"
          class="chip all"
          aria-pressed=${this.usarTodos}
          title="Seleccionar todos los tipos"
          @click=${this._activarTodos}
        >
          <span class="name">Todos los tipos</span>
        </button>
      </div>
      <div class="help">
        Selecciona uno o varios tipos por su nombre. Si eliges <strong>Todos los tipos</strong>, se enviará <code>tipos: "TODO"</code>.
      </div>
    `;
  }

  _renderProgreso() {
    if (!this._cargando && this._pct === 0) return null;
    return html`
      <div class="col-12">
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${this._pct}>
          <div class="bar" style=${`--w:${this._pct}%`}></div>
        </div>
        <div class="status"><span>${this._msg}</span><span>${this._pct}%</span></div>
      </div>
    `;
  }

  render() {
    const ids = this._parseIds();
    const sesionOk = Boolean(this.loginData?.usuario?.id_usuario && this.loginData?.institucion?.id_institucion);

    return html`
      <div class="wrap">
        <header class="header">
          <h1 class="title">⬇️ Descarga BAT de Admisiones</h1>
          <p class="subtitle">Usa el nombre del documento (no abreviaturas). Endpoint único: <code>${DESCARGA_URL}</code>.</p>
        </header>

        <form class="card" @submit=${this._descargarBat}>
          <div class="grid">
            <div class="col-12">
              <label>
                Números de admisión
                <textarea
                  .value=${this.numeros}
                  @input=${e => this.numeros = e.target.value}
                  placeholder="Ej: 123, 456 789&#10;Uno por línea o separados por coma/espacio"></textarea>
                <div class="help">${ids.length} ID(s) detectado(s)</div>
              </label>
            </div>

            <div class="col-4">
              <label>
                EPS
                <select .value=${this.eps} @change=${e => this.eps = e.target.value}>
                  <option value="NUEVA_EPS">NUEVA_EPS</option>
                  <option value="SALUD_TOTAL">SALUD_TOTAL</option>
                  <option value="OTRA_EPS">OTRA_EPS</option>
                </select>
                <span class="help">Entidad pagadora</span>
              </label>
            </div>

            <div class="col-4">
              <label>
                Modalidad
                <select .value=${this.modalidad} @change=${e => this.modalidad = e.target.value}>
                  <option value="evento">evento</option>
                  <option value="capita">capita</option>
                </select>
                <span class="help">Afecta el armado del BAT en el servidor</span>
              </label>
            </div>

            <div class="col-12">
              <label>Tipos de documento</label>
              ${this._renderChips()}
            </div>

            <div class="col-12 row" style="margin-top:4px;">
              <label class="row" style="gap:8px; align-items:center;">
                <input type="checkbox" .checked=${this.incluirFactura} @change=${e => this.incluirFactura = e.target.checked} />
                <span>Incluir factura electrónica</span>
              </label>

              <button class="btn primary" ?disabled=${this._cargando || !sesionOk} type="submit">
                ${this._cargando ? 'Generando…' : 'Generar y descargar BAT'}
              </button>
              <button class="btn ghost" type="button" ?disabled=${this._cargando} @click=${this._limpiar}>
                Limpiar
              </button>
            </div>

            ${this._renderProgreso()}
            ${this._error ? html`<div class="col-12 err">⚠️ ${this._error}</div>` : null}

            ${!sesionOk ? html`
              <div class="col-12" style="color:#ffd166;">
                <strong>Sin datos de sesión</strong> — Asigna <code>loginData.usuario.id_usuario</code> y <code>loginData.institucion.id_institucion</code>.
              </div>
            `: null}
          </div>
        </form>

        <!-- 3 cajitas con instrucciones simples -->
        <section class="instructions">
          <div class="ibox">
            <h3>1) Pega los IDs</h3>
            <p>Pega los números de admisión. Puedes separarlos por coma, espacio o una línea por ID. Se quitan duplicados.</p>
          </div>
          <div class="ibox">
            <h3>2) Elige documentos</h3>
            <p>Marca por <strong>nombre</strong> (Historia Clínica, Epicrisis, etc.). Si no estás seguro, usa <strong>Todos los tipos</strong>.</p>
          </div>
          <div class="ibox">
            <h3>3) Descarga el BAT</h3>
            <p>Revisa EPS y modalidad. Activa “Incluir factura” si aplica y presiona <strong>Generar y descargar BAT</strong>.</p>
          </div>
        </section>
      </div>
    `;
  }
}

customElements.define('admiciones-archivos', AdmicionesArchivos);
