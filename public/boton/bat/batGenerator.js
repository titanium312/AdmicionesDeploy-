// Generador de scripts BAT separado del componente
// API principal: generateBat(data, { groupBy, basePath, mainFolderName }, fetchFn?)

export function escapeBat(str = '') {
  return String(str)
    .replace(/%/g, '%%')
    .replace(/!/g, '^^!')
    .replace(/"/g, '\\"');
}

function extractNumeroFromUrl(url) {
  if (!url) return '';
  const m = url.match(/[?&]numeroAdmision=(\d+)/i) || url.match(/[?&]numeroFactura=(\d+)/i);
  return m ? m[1] : '';
}

function extractNumero(item, groupBy = 'numeroAdmision') {
  const c = item?.criterio || {};
  const prefer = groupBy || c?.tipo || 'numeroAdmision';
  if (c?.tipo === prefer && c?.numero) return c.numero;
  if (c?.numero && c?.tipo) return c.numero;
  const fromDocs = extractNumeroFromUrl(item?.docs?.url);
  const fromFac = extractNumeroFromUrl(item?.factura?.url);
  return fromDocs || fromFac || '';
}

function batHeader({ basePath = '', mainFolderName = 'Documentos_Descargados' }) {
  const lines = [];
  lines.push('@echo off');
  lines.push('chcp 65001 > nul');
  lines.push('setlocal enabledelayedexpansion');
  lines.push('title Descarga de documentos (curl)');

  if (basePath && String(basePath).trim()) {
    const base = escapeBat(String(basePath).trim());
    lines.push(`set "base=${base}"`);
    lines.push(`set "mainFolder=${escapeBat(mainFolderName)}"`);
    lines.push('if not exist "%base%" mkdir "%base%"');
    lines.push('pushd "%base%"');
    lines.push('if not exist "!mainFolder!" mkdir "!mainFolder!"');
    lines.push('pushd "!mainFolder!"');
  } else {
    lines.push(`set "mainFolder=${escapeBat(mainFolderName)}"`);
    lines.push('if not exist "!mainFolder!" mkdir "!mainFolder!"');
    lines.push('pushd "!mainFolder!"');
  }

  lines.push('echo Iniciando descargas...');
  lines.push('echo.');
  return lines.join('\n') + '\n';
}

function batFooter({ basePath = '' }) {
  const lines = [];
  lines.push('popd'); // salir de carpeta principal
  if (basePath && String(basePath).trim()) {
    lines.push('popd'); // salir de basePath si existía
  }
  lines.push('echo.');
  lines.push('echo Proceso completado.');
  lines.push('pause');
  return '\n' + lines.join('\n');
}

function entryHeader(numero) {
  const folder = escapeBat(`admision-${numero || 'sin-numero'}`);
  return [
    `echo =====================================================`,
    `echo  Procesando ${folder}`,
    `echo =====================================================`,
    `set "dest=${folder}"`,
    `if not exist "!dest!" mkdir "!dest!"`,
    `echo.`,
  ].join('\n') + '\n';
}

function batCurlToName(url, outPathHuman) {
  const u = escapeBat(url);
  const o = escapeBat(outPathHuman);
  return [
    `curl -L "${u}" --output "!dest!\\${o}" --silent --fail`,
    `if !errorlevel! equ 0 (echo  [OK] ${o}) else (echo  [ERROR] ${o})`,
  ].join('\n') + '\n';
}

function batCurlOJ(url) {
  const u = escapeBat(url);
  return [
    `pushd "!dest!"`,
    `curl -L -OJ "${u}" --silent --fail`,
    `if !errorlevel! equ 0 (echo  [OK] Factura descargada) else (echo  [ERROR] Factura)`,
    `popd`,
  ].join('\n') + '\n';
}

/**
 * Genera el contenido de un .bat en base a los datos proporcionados.
 * @param {Array} data Lista de items con { criterio?, docs?:{url}, factura?:{url} }
 * @param {Object} opts { groupBy, basePath, mainFolderName }
 * @param {Function} fetchFn Función de fetch (por defecto: globalThis.fetch). Inyectable para testear.
 * @returns {Promise<string>}
 */
export async function generateBat(
  data,
  {
    groupBy = 'numeroAdmision',
    basePath = '',
    mainFolderName = 'Documentos_Descargados',
  } = {},
  fetchFn = (typeof fetch !== 'undefined' ? fetch : null)
) {
  if (!Array.isArray(data) || data.length === 0) {
    return 'REM No hay datos para procesar.';
  }

  let bat = batHeader({ basePath, mainFolderName });

  const blocks = await Promise.all(
    data.map(async (item) => {
      const numero = extractNumero(item, groupBy);
      const docsUrl = item?.docs?.url || '';
      const facturaUrl = item?.factura?.url || '';

      let block = entryHeader(numero);

      // Documentos de admisión (JSON)
      if (docsUrl) {
        try {
          if (!fetchFn) throw new Error('fetch no disponible en este entorno');
          const resp = await fetchFn(docsUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const j = await resp.json();

          const key =
            (numero && j[`admision-${numero}`] ? `admision-${numero}` : null) ||
            Object.keys(j).find(k => /^admision-\d+$/i.test(k));

          const items = key ? j[key] : [];

          if (Array.isArray(items) && items.length > 0) {
            block += `echo Descargando documentos de admision...\n`;
            for (const doc of items) {
              if (doc?.url && doc?.nombrepdf) {
                block += batCurlToName(doc.url, doc.nombrepdf);
              }
            }
            block += 'echo.\n';
          } else {
            block += 'echo (sin documentos de admision o JSON vacio)\n';
          }
        } catch (e) {
          block += `echo <ERROR> No se pudo obtener documentos de admision: ${escapeBat(e.message)}\n`;
        }
      } else {
        block += 'echo (sin URL de admision)\n';
      }

      // Factura (descarga -OJ)
      if (facturaUrl) {
        block += 'echo Descargando factura...\n';
        block += batCurlOJ(facturaUrl);
        block += 'echo.\n';
      } else {
        block += 'echo (sin URL de factura)\n';
      }

      return block;
    })
  );

  bat += blocks.join('\n');
  bat += batFooter({ basePath });
  return bat;
}
