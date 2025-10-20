// routes/Controller/Laboratorio.js
const axios = require('axios').default;
const { pipeline } = require('node:stream/promises');
const { createToken } = require('../Base/toke');
const {
  obtenerIds,
  obtenerIdsPorAdmision,
  obtenerIdentidadPorNumeroAdmision,
} = require('../Base/ids'); // <- extrae tipo, número, fecha nac., fecha admisión y fecha emisión (factura)

const ALLOWED_MODES = new Set(['stream', 'redirect', 'json']);

// Helpers de normalización (para comparar)
function normStr(v) {
  if (v == null) return null;
  return String(v).trim();
}
function normUpper(v) {
  const s = normStr(v);
  return s == null ? null : s.toUpperCase();
}
function normDigits(v) {
  const s = normStr(v);
  return s == null ? null : s.replace(/\D+/g, '');
}
function normDateOnly(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) {
    const s = String(v);
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function DescargarLaboratorio(req, res) {
  const t0 = Date.now();
  let upstream = null;

  try {
    const {
      institucionId,
      idUser,
      clave,
      numeroAdmision,
      idAdmision: idAdmisionRaw,
      mode = 'stream',

      // ✅ Valores que envías para COMPARAR (no se “buscan”, solo se contrastan)
      tipoDocumento: expectedTipoDocumento,
      numeroDocumento: expectedNumeroDocumento,
      fechaEmision: expectedFechaEmision,
      fechaNacimiento: expectedFechaNacimiento,
    } = req.query;

    // --- Input validation
    const faltantes = [];
    if (!institucionId) faltantes.push('institucionId');
    if (!idUser) faltantes.push('idUser');
    const anyKey = clave ?? numeroAdmision ?? idAdmisionRaw;
    if (!anyKey) faltantes.push('clave|numeroAdmision|idAdmision');
    if (faltantes.length) {
      return res.status(400).send(`❌ Faltan parámetros: ${faltantes.join(', ')}`);
    }
    const modeNorm = String(mode).toLowerCase();
    if (!ALLOWED_MODES.has(modeNorm)) {
      return res.status(400).send('❌ mode inválido. Use stream|redirect|json');
    }

    const instId = Number(institucionId);
    const userId = Number(idUser);
    if (!Number.isFinite(instId) || !Number.isFinite(userId)) {
      return res.status(400).send('❌ institucionId/idUser deben ser numéricos');
    }

    // --- Resolver IDs + metadatos
    const claveFinal = String(anyKey).trim();
    let ids;
    if (idAdmisionRaw && !clave && !numeroAdmision) {
      ids = await obtenerIdsPorAdmision({
        institucionId: instId,
        idAdmision: Number(idAdmisionRaw),
      });
    } else {
      ids = await obtenerIds({
        institucionId: instId,
        clave: claveFinal,
      });
    }

    // Camino directo por numeroAdmision (obtiene tipo/num doc, fecha nac, fecha adm y fecha emisión)
    let identidadPorNumero = null;
    if (numeroAdmision) {
      try {
        identidadPorNumero = await obtenerIdentidadPorNumeroAdmision({
          institucionId: instId,
          numeroAdmision: Number(numeroAdmision),
        });
      } catch (_) { /* no-op */ }
    }

    const resolvedAdmisionId =
      Number(ids?.id_admision) ||
      Number(identidadPorNumero?.fk_admision) ||
      Number(idAdmisionRaw) ||
      Number(numeroAdmision) ||
      (Number.isFinite(Number(claveFinal)) ? Number(claveFinal) : 0);

    if (!resolvedAdmisionId) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un idAdmision válido para Laboratorio',
      });
    }

    // =============== BLOQUES DE COMPARACIÓN =================

    // A) Comparación contra valores ENVIADOS por el cliente (si los envía)
    //    Solo comparamos campos que el cliente haya enviado.
    const provided = {
      tipoDocumento: normUpper(expectedTipoDocumento),
      numeroDocumento: normDigits(expectedNumeroDocumento),
      fechaEmision: normDateOnly(expectedFechaEmision),
      fechaNacimiento: normDateOnly(expectedFechaNacimiento),
    };

    // Valores “verdad” desde BD (preferimos identidadPorNumero; si no, ids)
    const truth = {
      tipoDocumento: normUpper(identidadPorNumero?.tipo_documento ?? ids?.tipoDocumento),
      numeroDocumento: normDigits(identidadPorNumero?.numero_documento ?? ids?.numero_documento),
      fechaEmision: normDateOnly(identidadPorNumero?.fecha_emision ?? null), // ids no trae emisión
      fechaNacimiento: normDateOnly(identidadPorNumero?.fecha_nacimiento ?? ids?.fecha_nacimiento),
    };

    const mismatchesProvided = [];
    if (provided.tipoDocumento && truth.tipoDocumento && provided.tipoDocumento !== truth.tipoDocumento) {
      mismatchesProvided.push({ campo: 'tipoDocumento', enviado: provided.tipoDocumento, bd: truth.tipoDocumento });
    }
    if (provided.numeroDocumento && truth.numeroDocumento && provided.numeroDocumento !== truth.numeroDocumento) {
      mismatchesProvided.push({ campo: 'numeroDocumento', enviado: provided.numeroDocumento, bd: truth.numeroDocumento });
    }
    if (provided.fechaEmision && truth.fechaEmision && provided.fechaEmision !== truth.fechaEmision) {
      mismatchesProvided.push({ campo: 'fechaEmision', enviado: provided.fechaEmision, bd: truth.fechaEmision });
    }
    if (provided.fechaNacimiento && truth.fechaNacimiento && provided.fechaNacimiento !== truth.fechaNacimiento) {
      mismatchesProvided.push({ campo: 'fechaNacimiento', enviado: provided.fechaNacimiento, bd: truth.fechaNacimiento });
    }

    if (mismatchesProvided.length > 0) {
      return res.status(409).json({
        success: false,
        error: '❌ Los datos enviados no coinciden con los de la base de datos',
        detalle: {
          idAdmision: resolvedAdmisionId,
          mismatches: mismatchesProvided,
          enviados: {
            tipoDocumento: expectedTipoDocumento ?? null,
            numeroDocumento: expectedNumeroDocumento ?? null,
            fechaEmision: expectedFechaEmision ?? null,
            fechaNacimiento: expectedFechaNacimiento ?? null,
          },
          bd: {
            tipoDocumento: identidadPorNumero?.tipo_documento ?? ids?.tipoDocumento ?? null,
            numeroDocumento: identidadPorNumero?.numero_documento ?? ids?.numero_documento ?? null,
            fechaEmision: identidadPorNumero?.fecha_emision ?? null,
            fechaNacimiento: identidadPorNumero?.fecha_nacimiento ?? ids?.fecha_nacimiento ?? null,
          },
        },
      });
    }

    // B) (Opcional) Comparación entre fuentes internas (ids vs identidadPorNumero).
    //    Si NO quieres esta validación adicional, comenta este bloque.
    if (numeroAdmision && identidadPorNumero) {
      const a = {
        tipoDocumento: normUpper(ids?.tipoDocumento),
        numeroDocumento: normDigits(ids?.numero_documento),
        fechaNacimiento: normDateOnly(ids?.fecha_nacimiento),
      };
      const b = {
        tipoDocumento: normUpper(identidadPorNumero?.tipo_documento),
        numeroDocumento: normDigits(identidadPorNumero?.numero_documento),
        fechaNacimiento: normDateOnly(identidadPorNumero?.fecha_nacimiento),
      };
      const mismatchesInternal = [];
      if (a.tipoDocumento && b.tipoDocumento && a.tipoDocumento !== b.tipoDocumento) {
        mismatchesInternal.push({ campo: 'tipoDocumento', ids: a.tipoDocumento, numero: b.tipoDocumento });
      }
      if (a.numeroDocumento && b.numeroDocumento && a.numeroDocumento !== b.numeroDocumento) {
        mismatchesInternal.push({ campo: 'numeroDocumento', ids: a.numeroDocumento, numero: b.numeroDocumento });
      }
      if (a.fechaNacimiento && b.fechaNacimiento && a.fechaNacimiento !== b.fechaNacimiento) {
        mismatchesInternal.push({ campo: 'fechaNacimiento', ids: a.fechaNacimiento, numero: b.fechaNacimiento });
      }
      // Nota: fechaEmision pertenece a factura (solo disponible en identidadPorNumero), por eso no se compara aquí.

      if (mismatchesInternal.length > 0) {
        return res.status(409).json({
          success: false,
          error: '❌ Inconsistencia interna entre fuentes (ids vs numeroAdmision)',
          detalle: {
            idAdmision: resolvedAdmisionId,
            mismatches: mismatchesInternal,
          },
        });
      }
    }

    // ========================================================

    // --- Armar URL del reporte (host fijo para evitar SSRF)
    const reporte = 'ListadoInformesResultadosLaboratorio';
    const modulo = 'Laboratorio';
    const token = createToken(reporte, instId, 83, userId);

    const urlParams = new URLSearchParams({
      modulo,
      reporte,
      render: 'pdf',
      hideTool: 'true',
      environment: '1',
      userId: String(userId),
      idAdmision: String(resolvedAdmisionId),
      token,
    });

    const reportHost = 'https://reportes.saludplus.co';
    const url = `${reportHost}/view.aspx?${urlParams.toString()}`;
    const filename = `laboratorio_${resolvedAdmisionId}.pdf`;

    // --- Modos alternos
    if (modeNorm === 'redirect') {
      return res.redirect(302, url);
    }
    if (modeNorm === 'json') {
      return res.json({
        success: true,
        reporte,
        idAdmision: resolvedAdmisionId,
        filename,
        url,
        // Datos útiles en respuesta
        tipoDocumento: identidadPorNumero?.tipo_documento ?? ids?.tipoDocumento ?? null,
        numeroDocumento: identidadPorNumero?.numero_documento ?? ids?.numero_documento ?? null,
        fechaNacimiento: identidadPorNumero?.fecha_nacimiento ?? ids?.fecha_nacimiento ?? null,
        fechaAdmision: identidadPorNumero?.fecha_admision ?? ids?.fecha_admision ?? null,
        fechaEmision: identidadPorNumero?.fecha_emision ?? null,
        idFactura: identidadPorNumero?.id_factura ?? null,
        numeroFactura: identidadPorNumero?.numero_factura ?? ids?.numeroFactura ?? null,
      });
    }

    // --- STREAM PDF con abort y pipeline
    const controller = new AbortController();
    const clientAborted = () => controller.abort();

    req.on('close', clientAborted);
    req.on('aborted', clientAborted);

    const hardTimeout = setTimeout(() => controller.abort(), 35_000);

    const upstream = await axios.get(url, {
      responseType: 'stream',
      timeout: 30_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        Accept: 'application/pdf,*/*',
        'User-Agent': 'curl/8 Node/axios',
      },
      validateStatus: () => true,
      signal: controller.signal,
      maxRedirects: 3,
      withCredentials: false,
    });

    const ct = String(upstream.headers['content-type'] || '').toLowerCase();
    const len = upstream.headers['content-length']
      ? Number(upstream.headers['content-length'])
      : null;

    if (upstream.status !== 200 || !ct.includes('application/pdf') || len === 0) {
      let errBody = '';
      try {
        errBody = await new Promise((resolve, reject) => {
          let data = '';
          upstream.data.setEncoding('utf8');
          upstream.data.on('data', (chunk) => (data += chunk));
          upstream.data.on('end', () => resolve(data));
          upstream.data.on('error', reject);
        });
      } catch {
        errBody = '[no se pudo leer el cuerpo de error]';
      }
      clearTimeout(hardTimeout);

      const payload = {
        success: false,
        error: '❌ El servicio de reportes no devolvió un PDF',
        detalle: {
          status: upstream.status,
          contentType: ct || null,
          contentLength: len ?? null,
          url,
          body: errBody?.slice(0, 1000),
          ms: Date.now() - t0,
        },
      };
      return res.status(upstream.status || 502).json(payload);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    try {
      await pipeline(upstream.data, res);
    } finally {
      clearTimeout(hardTimeout);
    }
  } catch (error) {
    console.error('🔥 Error en DescargarLaboratorio:', {
      msg: error?.message,
      code: error?.code,
      name: error?.name,
    });
    const aborted = error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
    if (!res.headersSent) {
      return res.status(aborted ? 499 : 500).json({
        success: false,
        error: aborted ? '❌ Conexión cancelada/tiempo agotado' : '❌ Error interno del servidor',
        detalle: error.message,
      });
    }
    res.destroy(error);
  }
}

module.exports = { DescargarLaboratorio };
