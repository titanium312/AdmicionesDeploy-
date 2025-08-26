// loguin-main.js — Interfaz de login neoformista, elegante y con homenaje sutil a "GPT"
// (versión con "Recordarme" en la esquina del formulario + fixes de estilos/handler)
import { LitElement, html, css } from 'lit';
import './main.js';
import { BASE_URL, apiFetch } from './api.js';

// Helpers seguros para Storage
const safeSet = (storage, k, v) => { try { storage.setItem(k, v); return true; } catch { return false; } };
const safeGet = (storage, k) => { try { return storage.getItem(k); } catch { return null; } };
const safeDel = (storage, k) => { try { storage.removeItem(k); } catch {} };
const storageOK = () => {
  try { const x='__t__'; localStorage.setItem(x,x); localStorage.removeItem(x); return true; }
  catch { return false; }
};

// Ofuscación simple (Base64) — evita token plano en localStorage (NO es seguridad real)
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64encode = (str) => {
  const bytes = enc.encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
};
const b64decode = (b64) => {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return dec.decode(bytes);
};

// Claves y utilidades de expiración
const KEYS = {
  REMEMBER_FLAG: 'remember_flag',
  REMEMBER_USER: 'remember_username',
  TOKEN_LS: 'auth_token',
  TOKEN_EXP: 'auth_token_exp',
  PAYLOAD_LS: 'auth_payload_b64'
};
const SESSION = {
  TOKEN: 'auth_token',
  PAYLOAD: 'auth_payload_b64'
};
const ONE_HOUR_MS = 60 * 60 * 1000;
const nowMs = () => Date.now();

class Loguin extends LitElement {
  static properties = {
    username: { type: String },
    password: { type: String },
    errorMessage: { type: String },
    loginData: { type: Object },
    loading: { type: Boolean },
    showPassword: { type: Boolean },
    remember: { type: Boolean },
    _year: { state: true },
  };

  static styles = css`
  :host {
    --primary: #1a1a2e;
    --secondary: #16213e;
    --accent: #7f5af0;
    --accent-2: #b388ff;
    --accent-cyan: #2cb67d;
    --text: #fffffe;
    --text-muted: #94a1b2;
    --error: #ff3860;
    --success: #2cb67d;
    --radius: 12px;
    --ease: cubic-bezier(0.22, 1, 0.36, 1);
    --transition: all 0.4s var(--ease);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .scene {
    position: relative;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 2rem;
    background-color: var(--primary);
    color: var(--text);
    overflow: hidden;
    isolation: isolate;
  }

  /* Fondo */
  .bg-aurora {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 75% 30%, rgba(47, 33, 107, 0.3) 0%, transparent 60%);
    z-index: -2;
    animation: aurora 16s infinite alternate;
  }
  .bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.15;
    z-index: -1;
  }
  .orb-a { width: 300px; height: 300px; background: var(--accent); top: -100px; right: -100px; animation: float-a 24s infinite var(--ease); }
  .orb-b { width: 400px; height: 400px; background: var(--accent-cyan); bottom: -150px; left: -100px; animation: float-b 20s infinite var(--ease); }

  /* Contenedor */
  .shell {
    position: relative;
    width: 100%;
    max-width: 420px;
    background: rgba(26, 26, 46, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: var(--radius);
    padding: 2.5rem;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25),
      0 2px 6px rgba(0, 0, 0, 0.1),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transform: translateY(0);
    transition: var(--transition);
  }
  .shell:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.15),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  /* Esquina decorativa opcional (no usada ahora) */
  .che-icon {
    position: absolute;
    top: 10px; right: 10px; z-index: 20;
    pointer-events: none;
    user-select: none;
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 36px; min-height: 36px; padding: 6px 8px; border-radius: 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    transition: transform .25s var(--ease), opacity .25s var(--ease);
  }
  .che-icon:hover { transform: translateY(-1px) scale(1.02); }
  .che-icon img { width: 28px; height: 28px; object-fit: contain; border-radius: 6px; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.35)); }
  .che-icon .che-text { font-size: 18px; line-height: 1; color: var(--text); opacity: 0.95; text-shadow: 0 1px 2px rgba(0,0,0,0.35); }

  /* Branding */
  .brand-wrap { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 2.5rem; }
  .brand { width: 64px; height: 64px; animation: halo 6s infinite ease-in-out; }
  .brand-text {
    font-size: 1.5rem; font-weight: 600; letter-spacing: 0.05em;
    background: linear-gradient(90deg, var(--accent), var(--accent-cyan));
    -webkit-background-clip: text; background-clip: text; color: transparent; text-transform: uppercase;
  }

  /* Header */
  .header { text-align: center; margin-bottom: 2rem; }
  .header h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
  .muted { color: var(--text-muted); font-size: 0.875rem; }

  /* Formulario */
  .form { display: flex; flex-direction: column; gap: 1.5rem; }
  .group { position: relative; }
  .float { position: relative; }

  /* SOLO inputs de texto/clave (no checkbox) */
  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 1rem;
    transition: var(--transition);
    outline: none;
  }
  input[type="text"]:focus,
  input[type="password"]:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(127, 90, 240, 0.2); }
  input[type="text"]:disabled,
  input[type="password"]:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Label flotante SOLO en .float */
  .float label {
    position: absolute; left: 1rem; top: 1rem; color: var(--text-muted);
    pointer-events: none; transition: var(--transition); transform-origin: left center;
  }
  .float input:focus + label,
  .float input:not(:placeholder-shown) + label { transform: translateY(-1.5rem) scale(0.85); color: var(--accent); }

  .peek {
    position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; font-size: 1.25rem; transition: var(--transition);
  }
  .peek:hover { color: var(--accent); transform: translateY(-50%) scale(1.1); }
  .peek:disabled { opacity: 0.5; cursor: not-allowed; }

  .glow { position: absolute; inset: 0; border-radius: var(--radius); pointer-events: none; opacity: 0; box-shadow: 0 0 12px var(--accent); transition: var(--transition); }
  .float input:focus ~ .glow { opacity: 0.4; }

  /* Checkbox flotante en esquina superior derecha del formulario */
  .remember-top {
    position: absolute;
    top: 12px; right: 12px;
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: rgba(255,255,255,0.06);
    padding: 0.25rem 0.5rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    z-index: 25; /* por encima del contenido del shell */
    user-select: none;
  }
  .remember-top input[type="checkbox"] {
    width: auto; height: auto; margin: 0; accent-color: var(--accent);
    background: initial; border: initial; border-radius: 3px;
  }
  .remember-top span { font-size: 0.75rem; color: var(--text-muted); }

  .cta {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--accent), var(--accent-2));
    color: white; border: none; border-radius: var(--radius);
    font-size: 1rem; font-weight: 500; cursor: pointer; transition: var(--transition);
    display: flex; justify-content: center; align-items: center; gap: 0.5rem;
    box-shadow: 0 4px 12px rgba(127, 90, 240, 0.2);
  }
  .cta:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(127, 90, 240, 0.3); }
  .cta:disabled { opacity: 0.7; cursor: not-allowed; }

  .spinner {
    width: 1rem; height: 1rem; border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite;
  }

  .error {
    color: var(--error); background: rgba(255, 56, 96, 0.1);
    padding: 0.75rem 1rem; border-radius: var(--radius); font-size: 0.875rem; text-align: center; animation: shake 0.4s var(--ease);
  }

  .foot { text-align: center; margin-top: 2rem; font-size: 0.75rem; }

  /* Animaciones */
  @keyframes halo { 0%,100%{opacity:1} 50%{opacity:.8; filter: drop-shadow(0 0 8px var(--accent));} }
  @keyframes aurora { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
  @keyframes float-a { 0%,100%{ transform: translate(0,0);} 50%{ transform: translate(-20px,20px);} }
  @keyframes float-b { 0%,100%{ transform: translate(0,0);} 50%{ transform: translate(20px,-20px);} }
  @keyframes spin { to { transform: rotate(360deg);} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-4px)} 40%,80%{transform:translateX(4px)} }

  /* Responsive */
  @media (max-width: 480px) {
    .shell { padding: 1.5rem; }
    .remember-top { top: 8px; right: 8px; }
  }
  `;

  constructor() {
    super();
    this.username = '';
    this.password = '';
    this.errorMessage = '';
    this.loginData = null;
    this.loading = false;
    this.showPassword = false;
    this._year = new Date().getFullYear();

    // Estado inicial de "Recordarme"
    this.remember = true;
    if (storageOK()) {
      const rememberFlag = safeGet(localStorage, KEYS.REMEMBER_FLAG);
      if (rememberFlag !== null) this.remember = rememberFlag === '1';
      const savedUser = safeGet(localStorage, KEYS.REMEMBER_USER);
      if (savedUser) this.username = savedUser;
    }
  }

  firstUpdated() {
    // Auto-login SOLO si "Recordarme" está activo y no expiró
    if (!this.remember || !storageOK()) return;

    const encToken = safeGet(localStorage, KEYS.TOKEN_LS);
    const expStr   = safeGet(localStorage, KEYS.TOKEN_EXP);
    if (!encToken || !expStr) return;

    const exp = parseInt(expStr, 10);
    if (!Number.isFinite(exp)) {
      this.#clearPersistent();
      return;
    }

    if (nowMs() < exp) {
      let restored = null;
      const payloadB64 = safeGet(localStorage, KEYS.PAYLOAD_LS);
      if (payloadB64) {
        try { restored = JSON.parse(b64decode(payloadB64)); } catch { restored = null; }
      }
      const token = b64decode(encToken);
      this.loginData = restored && typeof restored === 'object' ? { ...restored, token } : { token };
      this.dispatchEvent(new CustomEvent('login-success', { detail: this.loginData, bubbles: true, composed: true }));
    } else {
      this.#clearPersistent();
    }
  }

  #clearPersistent() {
    safeDel(localStorage, KEYS.TOKEN_LS);
    safeDel(localStorage, KEYS.TOKEN_EXP);
    safeDel(localStorage, KEYS.PAYLOAD_LS);
  }
  #clearSession() {
    safeDel(sessionStorage, SESSION.TOKEN);
    safeDel(sessionStorage, SESSION.PAYLOAD);
  }

  handleInput(e) {
    const t = e.currentTarget;
    if (!t) return;
    const { name, value } = t;
    if (name in this) {
      this[name] = value;
      if (name === 'username' && this.remember && storageOK()) {
        safeSet(localStorage, KEYS.REMEMBER_USER, value);
      }
    }
  }

  onRememberChange = (e) => {
    const checked = !!e.target?.checked;
    this.remember = checked;

    if (storageOK()) {
      safeSet(localStorage, KEYS.REMEMBER_FLAG, checked ? '1' : '0');
      if (!checked) {
        this.#clearPersistent();
        safeDel(localStorage, KEYS.REMEMBER_USER);
      } else if (this.username) {
        safeSet(localStorage, KEYS.REMEMBER_USER, this.username);
      }
    }
  };

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
    this.updateComplete.then(() => {
      const input = this.renderRoot?.querySelector('#password');
      if (input) input.focus();
    });
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.loading) return;

    this.errorMessage = '';
    this.loginData = null;
    this.loading = true;

    try {
      const payload = await apiFetch('/api/istitucion', {
        method: 'POST',
        body: { username: this.username.trim(), password: this.password },
      });

      if (!payload || !payload.token) throw new Error('Respuesta inválida del servidor (falta token)');

      this.loginData = payload;

      this.dispatchEvent(new CustomEvent('login-success', {
        detail: this.loginData, bubbles: true, composed: true,
      }));

      if (storageOK()) {
        const payloadB64 = b64encode(JSON.stringify(this.loginData));
        if (this.remember) {
          const exp = nowMs() + ONE_HOUR_MS;
          safeSet(localStorage, KEYS.TOKEN_LS, b64encode(payload.token));
          safeSet(localStorage, KEYS.TOKEN_EXP, String(exp));
          safeSet(localStorage, KEYS.PAYLOAD_LS, payloadB64);
          safeSet(localStorage, KEYS.REMEMBER_USER, this.username.trim());
          safeSet(localStorage, KEYS.REMEMBER_FLAG, '1');
          this.#clearSession();
        } else {
          safeSet(sessionStorage, SESSION.TOKEN, this.loginData.token);
          safeSet(sessionStorage, SESSION.PAYLOAD, payloadB64);
          this.#clearPersistent();
          safeSet(localStorage, KEYS.REMEMBER_FLAG, '0');
          safeDel(localStorage, KEYS.REMEMBER_USER);
        }
      }

      this.password = '';
    } catch (err) {
      this.errorMessage = err?.message || 'Login incorrecto o error del servidor';
      console.error('[login] error:', err);
    } finally {
      this.loading = false;
    }
  }

  renderBrand() {
    return html`
      <div class="brand-wrap" aria-hidden="true">
        <svg class="brand" viewBox="0 0 64 64" fill="none" role="img">
          <defs>
            <linearGradient id="gptGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="var(--accent)"/>
              <stop offset="50%" stop-color="var(--accent-2)"/>
              <stop offset="100%" stop-color="var(--accent-cyan)"/>
            </linearGradient>
            <filter id="f1" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>
          <g filter="url(#f1)">
            <path d="M14 46c0-12 10-22 22-22h6" stroke="url(#gptGrad)" stroke-width="6" stroke-linecap="round"/>
            <path d="M42 12v28a12 12 0 1 1-12-12h16" stroke="url(#gptGrad)" stroke-width="6" stroke-linecap="round"/>
            <path d="M20 26h18" stroke="url(#gptGrad)" stroke-width="6" stroke-linecap="round"/>
          </g>
        </svg>
        <span class="brand-text" aria-label="GPT">Salud plus</span>
      </div>
    `;
  }

  render() {
    if (this.loginData) {
      return html`<main-p .loginData=${this.loginData}></main-p>`;
    }

    return html`
      <div class="scene">
        <div class="bg-aurora" aria-hidden="true"></div>
        <div class="bg-orb orb-a" aria-hidden="true"></div>
        <div class="bg-orb orb-b" aria-hidden="true"></div>

        <section class="shell" aria-live="polite" aria-busy=${this.loading ? 'true' : 'false'}>
          <!-- Checkbox flotante en la esquina del formulario -->
          <label class="remember-top" for="remember">
            <input
              id="remember"
              type="checkbox"
              name="remember"
              .checked=${!!this.remember}
              @change=${this.onRememberChange}
              ?disabled=${this.loading}
            />
            <span>Recordarme</span>
          </label>

          ${this.renderBrand()}

          <header class="header">
            <h1>Bienvenido</h1>
            <p class="muted">Accede para continuar</p>
          </header>

          <form class="form" @submit=${this.handleSubmit} novalidate>
            <div class="group">
              <div class="float">
                <input
                  id="username"
                  name="username"
                  type="text"
                  inputmode="text"
                  autocomplete="username"
                  placeholder=" "
                  .value=${this.username}
                  @input=${this.handleInput}
                  ?disabled=${this.loading}
                  required
                  aria-required="true"
                />
                <label for="username">Usuario</label>
                <div class="glow"></div>
              </div>
            </div>

            <div class="group">
              <div class="float">
                <input
                  id="password"
                  name="password"
                  type=${this.showPassword ? 'text' : 'password'}
                  autocomplete="current-password"
                  placeholder=" "
                  .value=${this.password}
                  @input=${this.handleInput}
                  ?disabled=${this.loading}
                  required
                  aria-required="true"
                />
                <label for="password">Contraseña</label>
                <button
                  type="button"
                  class="peek"
                  @click=${this.toggleShowPassword}
                  ?disabled=${this.loading}
                  aria-label=${this.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >${this.showPassword ? '🙈' : '👁️'}</button>
                <div class="glow"></div>
              </div>
            </div>

            ${this.errorMessage ? html`
              <div class="error" role="alert">${this.errorMessage}</div>
            ` : null}

            <button class="cta" type="submit" ?disabled=${this.loading}>
              ${this.loading
                ? html`<span class="spinner" aria-hidden="true"></span> Cargando…`
                : 'Iniciar sesión'}
            </button>
          </form>

          <footer class="foot muted">© ${this._year} — Interfaz con cariño ✦</footer>
        </section>
      </div>
    `;
  }
}

customElements.define('loguin-main', Loguin);
