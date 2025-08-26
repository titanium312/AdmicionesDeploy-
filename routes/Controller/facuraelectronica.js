// Archivo: descargarArchivo.js

const axios = require('axios');
const unzipper = require('unzipper');
const { pipeline } = require('stream/promises');

// ⬇️ APIs para IDs
const { obtenerIds, obtenerIdsPorAdmision } = require('./Base/ids');

/* =========================
 *  Utils
 * ========================= */
function sanitizeFilename(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarEPS(eps) {
  const e = String(eps || '').trim().toUpperCase();
  if (e === 'NUEVA EPS' || e === 'NUEVA_EPS') return 'NUEVA EPS';
  if (e === 'SALUD TOTAL' || e === 'SALUD_TOTAL') return 'SALUD TOTAL';
  return e;
}

// Toma la factura principal (mayor id_factura) o una que coincida
function pickFactura(facturasDetalle = [], preferNumeroFactura = null) {
  if (!Array.isArray(facturasDetalle) || facturasDetalle.length === 0) return null;
  if (preferNumeroFactura) {
    const match = facturasDetalle.find(
      f => String(f.numero_factura) === String(preferNumeroFactura)
    );
    if (match) return match;
  }
  return facturasDetalle.reduce(
    (acc, cur) => (!acc || Number(cur.id_factura) > Number(acc.id_factura) ? cur : acc),
    null
  );
}

/* =========================
 *  Controller
 * ========================= */
async function FacturaElectronica(req, res) {
  try {
    const { clave, numeroFactura, numeroAdmision, idAdmision, eps, institucionId, idUser } = req.query;

    console.log("📥 Query recibida:", req.query);

    // Validación de requeridos
    const faltantes = [];
    if (!eps) faltantes.push('eps');
    if (!institucionId) faltantes.push('institucionId');
    if (!idUser) faltantes.push('idUser');
    const anyKey = clave ?? numeroFactura ?? numeroAdmision ?? idAdmision;
    if (!anyKey) faltantes.push('clave|numeroFactura|numeroAdmision|idAdmision');

    if (faltantes.length > 0) {
      return res.status(400).send(`❌ Faltan parámetros: ${faltantes.join(', ')}`);
    }

    // 0) Resolver IDs
    let ids;
    if (!numeroFactura && !clave && (numeroAdmision || idAdmision)) {
      ids = await obtenerIdsPorAdmision({
        institucionId: Number(institucionId),
        idAdmision: Number(numeroAdmision ?? idAdmision),
      });
    } else {
      ids = await obtenerIds({
        institucionId: Number(institucionId),
        clave: String(anyKey),
      });
    }

    // 1) Factura principal
    const preferFacturaNum = numeroFactura ? String(numeroFactura).trim() : null;
    const principal = pickFactura(ids.facturasDetalle, preferFacturaNum);
    if (!principal?.id_factura) {
      return res.status(404).send('❌ No se encontraron facturas asociadas');
    }

    const idFactura = String(principal.id_factura);
    const noFactura = preferFacturaNum ?? ids?.numeroFactura ?? principal.numero_factura ?? idFactura;
    const nit = ids?.nitInstitucion ? String(ids.nitInstitucion) : 'NITDESCONOCIDO';

    // 2) Obtener URL del ZIP
    const zipInfoUrl = `https://server-01.saludplus.co/facturasAdministar/GetZipFile?IdFactura=${encodeURIComponent(idFactura)}`;

    const responseZip = await axios.get(zipInfoUrl);
    if (responseZip.data?.valorRetorno !== 1) {
      return res.status(400).send('❌ Error al obtener la información de la factura');
    }
    const archivoUrl = responseZip.data.archivo;
    if (!archivoUrl) {
      return res.status(400).send('❌ No se encontró la URL del archivo');
    }

    // 3) Construir nombre final SOLO 2 formatos
    const epsNorm = normalizarEPS(eps);
    let baseNombreFinal;
    if (epsNorm === 'NUEVA EPS') {
      baseNombreFinal = `FVS_${nit}_FEH${noFactura}`;
    } else if (epsNorm === 'SALUD TOTAL') {
      baseNombreFinal = `${nit}_FEH_${noFactura}_1_1`;
    } else {
      baseNombreFinal = `${nit}_${noFactura}`;
    }

    const finalSafe = `${sanitizeFilename(baseNombreFinal)}.pdf`;

    // 4) Descargar ZIP → extraer PDF → enviar al cliente
    const zipResp = await axios.get(archivoUrl, { responseType: 'arraybuffer' });
    const directory = await unzipper.Open.buffer(zipResp.data);

    const pdfEntry = directory.files.find((f) => /\.pdf$/i.test(f.path));
    if (!pdfEntry) {
      return res.status(400).send('❌ El ZIP no contiene ningún PDF');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${finalSafe}"; filename*=UTF-8''${encodeURIComponent(finalSafe)}`
    );

    await pipeline(pdfEntry.stream(), res);

  } catch (error) {
    console.error('🔥 Error en descarga directa de PDF:', error);
    if (!res.headersSent) {
      return res.status(500).send('❌ Error interno al generar la descarga del PDF');
    }
  }
}

module.exports = { FacturaElectronica };
