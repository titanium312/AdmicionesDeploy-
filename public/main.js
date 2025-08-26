import { LitElement, html, css } from 'lit';
import './documento-admicion.js';
import './loguin.js'; // 👈 para poder renderizar el login
import styles from './main-styles.js';
class Main extends LitElement {
  static properties = {
    loginData: { type: Object },
  };

static styles = styles;


  constructor() {
    super();
    this.loginData = null;
  }

  _initial(nombre) {
    if (!nombre || typeof nombre !== 'string') return '·';
    const n = nombre.trim();
    return n ? n.charAt(0).toUpperCase() : '·';
  }

  logout() {
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    } catch (err) {
      console.warn('No se pudo limpiar el almacenamiento', err);
    }
    this.loginData = null; // 👈 vuelve a null para renderizar el login
  }

  render() {
    // Si no hay loginData, mostrar login directamente
    if (!this.loginData) {
      return html`<loguin-main @login-success=${e => this.loginData = e.detail}></loguin-main>`;
    }

    const nombre = this.loginData?.usuario?.nombre ?? 'Usuario invitado';
    const perfiles = Array.isArray(this.loginData?.usuario?.perfiles)
      ? this.loginData.usuario.perfiles.join(', ')
      : (this.loginData?.usuario?.perfil || 'Sin perfil asignado');
    const nombreInstitucion = this.loginData?.institucion?.nombre_institucion ?? 'Institución no especificada';

    return html`
      <div class="container">
        <header class="welcome">
          <h1 class="title">¡Bienvenido!</h1>
          <p class="subtitle">Sistema de gestión institucional</p>
          <button class="logout-btn" @click=${this.logout}>⎋ Cerrar sesión</button>
        </header>

        ${this._card(nombre, perfiles, nombreInstitucion)}

        <section class="section">
          <h3 class="section-title">Módulos de Admisiones</h3>
          <div class="module-card">
            <admiciones-archivos .loginData=${this.loginData}></admiciones-archivos>
          </div>
        </section>
      </div>
    `;
  }

  _card(nombre, perfiles, nombreInstitucion) {
    const inicial = this._initial(nombre);
    return html`
      <article class="user-card">
        <div class="card-header">
          <div class="avatar">${inicial}</div>
          <div class="user-info">
            <h2>${nombre}</h2>
            <p>Información del usuario</p>
          </div>
          <span class="badge">Activo</span>
        </div>
        <div class="info-grid">
          ${this._infoItem('👤', 'Nombre completo', nombre)}
          ${this._infoItem('💼', 'Cargo / Perfil', perfiles)}
          ${this._infoItem('🏢', 'Institución', nombreInstitucion)}
        </div>
      </article>
    `;
  }

  _infoItem(emoji, label, value) {
    return html`
      <div class="info-item">
        <div class="info-label"><span>${emoji}</span>${label}</div>
        <div class="info-value">${value}</div>
      </div>
    `;
  }
}

customElements.define('main-p', Main);
