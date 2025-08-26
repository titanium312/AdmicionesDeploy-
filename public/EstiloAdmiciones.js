// loguin-styles.js
import { css } from 'lit';

/* loguin-styles.js */
export default css`

          

            /***************
             * 1) TOKENS
             ***************/
            :host {
              --color-bg: #ffffff;
              --color-bg-soft: #f8fafc;
              --color-surface: #ffffff;
              --color-text: #0f172a;
              --color-muted: #64748b;
              --color-border: #e2e8f0;
      
              --color-accent-600: #2563eb;
              --color-accent-500: #3b82f6;
              --color-success: #10b981;
              --color-warning: #f59e0b;
              --color-danger: #ef4444;
      
              --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
              --shadow: 0 2px 6px rgba(0,0,0,.08);
              --shadow-lg: 0 10px 20px rgba(0,0,0,.10);
      
              --radius-0: 0px;
              --radius-sm: 10px;
              --radius: 12px;
              --radius-lg: 16px;
      
              --chip-bg: #f1f5f9;         /* neutro claro */
              --chip-border: #e2e8f0;
              --chip-text: #0f172a;
              --chip-hover-bg: #e8eef6;   /* leve tinte azulado */
              --chip-hover-border: #cbd5e1;
              --chip-active-bg: #dbeafe;  /* sutil azul */
              --chip-active-border: #93c5fd;
              --chip-active-shadow: inset 0 0 0 1px rgba(37, 99, 235, .25);
      
              font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
              color: var(--color-text);
              display: block;
            }
      
            @media (prefers-color-scheme: dark) {
              :host {
                --color-bg: #0b1220;
                --color-bg-soft: #0f172a;
                --color-surface: #0b1220;
                --color-text: #e5e7eb;
                --color-muted: #94a3b8;
                --color-border: #1f2937;
      
                --chip-bg: #0f172a;
                --chip-border: #243244;
                --chip-text: #e5e7eb;
                --chip-hover-bg: #162238;
                --chip-hover-border: #334155;
                --chip-active-bg: #0e2a4f;
                --chip-active-border: #3b82f6;
              }
            }
      
            /***************
             * 2) BASE
             ***************/
            * { box-sizing: border-box; }
            .u-center { display: grid; place-items: center; }
            .u-muted { color: var(--color-muted); }
      
            /***************
             * 3) LAYOUT
             ***************/
            .l-container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 24px;
              background: linear-gradient(135deg, var(--color-bg-soft) 0%, var(--color-bg) 100%);
              min-height: 100vh;
            }
      
            .l-grid-main {
              display: grid;
              grid-template-columns: 1fr 400px;
              gap: 32px;
              align-items: start;
              margin-top: 16px;
            }
            @media (max-width: 900px) {
              .l-grid-main { grid-template-columns: 1fr; }
            }
      
            /***************
             * 4) COMPONENTES
             ***************/
            /* Header */
            .c-header {
              text-align: center;
              margin-bottom: 32px;
              padding: 24px;
              background: var(--color-surface);
              border-radius: var(--radius-lg);
              box-shadow: var(--shadow);
              position: relative;
              overflow: hidden;
              border: 1px solid var(--color-border);
            }
            .c-header::before {
              content: '';
              position: absolute;
              inset: 0 0 auto 0;
              height: 4px;
              background: linear-gradient(90deg, var(--color-accent-600), var(--color-success), var(--color-accent-600));
            }
            .c-header__title {
              margin: 0 0 8px;
              font-size: 2.5rem;
              font-weight: 800;
              background: linear-gradient(135deg, var(--color-accent-600), var(--color-accent-500));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .c-header__subtitle { margin: 0; font-size: 1.05rem; color: var(--color-muted); }
      
            /* Card */
            .c-card {
              background: var(--color-surface);
              border-radius: var(--radius-lg);
              padding: 24px;
              box-shadow: var(--shadow);
              border: 1px solid var(--color-border);
              transition: transform .2s ease, box-shadow .2s ease;
            }
            .c-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }
      
            /* Section title */
            .c-sectionTitle {
              font-size: 1.25rem; font-weight: 700; margin: 0 0 20px; display: flex; align-items: center; gap: 10px;
            }
            .c-sectionTitle::before { content: ''; width: 6px; height: 22px; border-radius: 3px; background: var(--color-accent-600); }
      
            /* Form */
            .c-field { margin-bottom: 20px; }
            .c-label { display:block; font-weight: 600; margin-bottom: 8px; font-size: .9rem; color: var(--color-muted); }
            .c-input, .c-select, .c-textarea {
              width: 100%; padding: 12px 14px; border: 2px solid var(--color-border); border-radius: var(--radius-sm); font-size: 1rem;
              background: var(--color-surface); color: var(--color-text); transition: border-color .15s ease, box-shadow .15s ease;
            }
            .c-input:focus, .c-select:focus, .c-textarea:focus { outline: none; border-color: var(--color-accent-600); box-shadow: 0 0 0 3px rgba(37, 99, 235, .25); }
            .c-textarea { min-height: 110px; resize: vertical; font-family: inherit; }
            .c-help { font-size: .85rem; color: var(--color-muted); margin-top: 6px; }
            .c-help.--danger { color: var(--color-danger); font-weight: 600; }
      
            /* Acciones (botones generales del formulario) */
            .c-actions { display:flex; gap:12px; margin-top: 22px; }
            .c-btn {
              display:inline-flex; align-items:center; justify-content:center; gap:8px; padding: 12px 18px; min-height: 46px;
              font-weight:700; border-radius: var(--radius-sm); border:1px solid transparent; cursor:pointer;
              transition: transform .12s ease, box-shadow .12s ease, background .12s ease, opacity .12s ease;
            }
            .c-btn:disabled { opacity:.6; cursor:not-allowed; transform:none !important; }
            .c-btn:hover:not(:disabled) { transform: translateY(-1px); }
            .c-btn.--primary { background: var(--color-accent-600); color: white; box-shadow: var(--shadow); }
            .c-btn.--primary:hover:not(:disabled) { background: var(--color-accent-500); box-shadow: var(--shadow-lg); }
            .c-btn.--secondary { background: var(--color-bg-soft); color: var(--color-text); border-color: var(--color-border); }
            .c-btn.--danger { background: var(--color-danger); color: white; }
      
            /* Progreso */
            .c-progress { background: linear-gradient(135deg, var(--color-bg-soft), var(--color-surface)); border:1px solid var(--color-border); border-radius: var(--radius-lg); padding: 18px; }
            .c-progress__head { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
            .c-progress__stats { font-size:.85rem; color:var(--color-muted); background: var(--color-surface); padding:4px 10px; border-radius: 9999px; border:1px solid var(--color-border); }
            .c-progress__bar { height: 10px; background: var(--color-border); border-radius: 9999px; overflow: hidden; }
            .c-progress__fill { height:100%; background: linear-gradient(90deg, var(--color-accent-600), var(--color-success)); transition: width .4s ease; position:relative; }
            .c-progress__fill::after { content:''; position:absolute; inset:0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); animation: shimmer 2s infinite; }
            @keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }
            .c-progress__label { text-align:center; margin-top:8px; color: var(--color-muted); font-size:.9rem; }
      
            /* Lista archivos */
            .c-filesList { max-height: 240px; overflow:auto; border:1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg-soft); }
            .c-fileItem { display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--color-border); transition: background .15s ease; }
            .c-fileItem:last-child { border-bottom:none; }
            .c-fileItem:hover { background: var(--color-surface); }
            .c-fileItem__icon { width: 36px; height: 36px; display:grid; place-items:center; border-radius: 8px; color:white; font-weight:700; background: var(--color-success); }
            .c-fileItem__name { font-weight: 700; }
            .c-fileItem__meta { font-size: .8rem; color: var(--color-muted); }
      
            /* TOASTS */
            .c-toasts { position: fixed; top: 24px; right: 24px; z-index: 1000; display:flex; flex-direction:column; gap:12px; }
            .c-toast { padding: 14px 16px; border-radius: var(--radius-sm); color: white; font-weight: 600; box-shadow: var(--shadow-lg); animation: slideIn .25s ease; max-width: 380px; }
            .c-toast.--success { background: var(--color-success); }
            .c-toast.--error { background: var(--color-danger); }
            .c-toast.--warning { background: var(--color-warning); }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity:1; } }
      
            .c-kbd { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: .75rem; border:1px solid var(--color-border); padding: 2px 6px; border-radius: 6px; background: var(--color-bg-soft); }
      
            /* ===============================
             * Doc Types (ANTES: chips)
             * =============================== */
            .docTypes { display:flex; flex-wrap:wrap; gap:10px; margin-top: 8px; }
            .docTypes__btn {
              /* Botón cuadrado, sobrio y profesional */
              appearance: none;
              background: var(--chip-bg);
              color: var(--chip-text);
              border: 1px solid var(--chip-border);
              border-radius: var(--radius-0);        /* sin radio */
              padding: 10px 14px;
              min-width: 160px;
              height: 40px;
              display: inline-grid;
              place-items: center;                    /* centra texto horizontal y vertical */
              font-weight: 600;
              font-size: .9rem;
              letter-spacing: .2px;
              cursor: pointer;
              transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .08s ease;
              user-select: none;
            }
            .docTypes__btn:hover {
              background: var(--chip-hover-bg);
              border-color: var(--chip-hover-border);
              box-shadow: var(--shadow-sm);           /* hover sutil */
            }
            .docTypes__btn:focus-visible {
              outline: none;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, .25);
            }
            .docTypes__btn[aria-pressed="true"] {
              /* Estado activo/presionado (persistente) */
              background: var(--chip-active-bg);
              border-color: var(--chip-active-border);
              box-shadow: var(--chip-active-shadow);
              transform: translateY(0);               /* sin rebote agresivo */
            }
            .docTypes__btn:active {
              transform: translateY(0.5px);
            }
      
            /* ===============================
             * Switch simple
             * =============================== */
            .c-switch { display:flex; align-items:center; gap:12px; cursor:pointer; padding: 10px; border-radius: var(--radius-sm); }
            .c-switch:hover { background: color-mix(in srgb, var(--color-bg-soft) 70%, transparent); }
            .c-switch input { width: 44px; height: 24px; appearance:none; background:#47556966; border-radius:12px; position:relative; transition: all .25s ease; cursor:pointer; }
            .c-switch input:checked { background: var(--color-success); }
            .c-switch input::before { content:''; position:absolute; inset:2px auto auto 2px; width:20px; height:20px; background:white; border-radius:50%; transition: transform .25s ease; box-shadow: var(--shadow-sm); }
            .c-switch input:checked::before { transform: translateX(20px); }
          

`;