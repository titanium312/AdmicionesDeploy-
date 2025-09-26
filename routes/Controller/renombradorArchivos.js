// renombradorArchivos.js
const { PREFIJOS_NUEVA_EPS } = require('./constantesReportes');

/** Construye el contexto base para nombrar archivos (usa SIEMPRE NIT). */
function construirContextoRenombramiento(ids, { idAdmision, institucionId }) {
  const nit = ids?.nitInstitucion || 'NITDESCONOCIDO';
  const tipoId = (ids?.tipoDocumento || 'CC').toString().toUpperCase();
  const numId = (ids?.numero_documento || '0000000000').toString();

  let numeroFactura = ids?.numeroFactura || '0';
  if (Array.isArray(ids?.facturasDetalle) && idAdmision) {
    const match = ids.facturasDetalle.find(
      f => String(f.id_admision || f.admisionId || ids.id_admision) === String(idAdmision)
    );
    if (match && (match.numero_factura || match.numeroFactura)) {
      numeroFactura = String(match.numero_factura || match.numeroFactura);
    }
  }

  return {
    nit: String(nit),
    tipoId,
    numId,
    factura: String(numeroFactura),
    institucionId: Number(institucionId) || 0,
    idAdmision: Number(idAdmision) || 0,
  };
}

/** Resuelve la factura específica asociada a un documento (si existe). */
function resolverFacturaParaDocumento(ids, tipoDocumento, id, facturaFallback) {
  const porDoc = ids?.facturasPorDocumento;
  if (porDoc && porDoc[tipoDocumento] && porDoc[tipoDocumento][id]) {
    return String(porDoc[tipoDocumento][id]);
  }
  return String(facturaFallback || ids?.numeroFactura || '0');
}

/** Determina modalidad (cápita/evento), respeta el query param si viene. */
function esCapita({ modalidad, ids }) {
  if (modalidad) {
    const m = String(modalidad).toLowerCase();
    if (m === 'capita' || m === 'cápita') return true;
    if (m === 'evento') return false;
    return false;
  }
  const cand = [
    ids?.modalidad,
    ids?.regimen,
    ids?.tipo_contrato,
    ids?.tipoContrato,
    ids?.modalidad_atencion,
    ids?.modalidadAtencion,
  ]
    .filter(Boolean)
    .map(v => String(v).toLowerCase());

  return cand.some(v => v.includes('cápita') || v.includes('capita') || v.includes('cap'));
}

/**
 * Genera el nombre final del PDF según EPS, tipoDocumento y modalidad.
 * - NUEVA_EPS: usa prefijos oficiales (Res. 1557/2023) desde PREFIJOS_NUEVA_EPS.
 *   * Si el tipoDocumento === 'factura' => usa FEV_<NIT>_<FACTURA>[...].pdf
 *   * Resto: <PREFIJO>_<NIT>_FEH<FACTURA>[...].pdf
 * - SALUD_TOTAL: mantiene el patrón actual.
 */
function generarNombreArchivo(eps, tipoDocumento, ctx, options = {}) {
  const { tipoId, numId, nit } = ctx;
  const factura = options.facturaPorDoc || ctx.factura || '0';

  if (eps === 'NUEVA_EPS') {
    const prefijo = PREFIJOS_NUEVA_EPS[tipoDocumento] || tipoDocumento.toUpperCase();

    if (tipoDocumento === 'factura') {
      if (options.esCapita) {
        return `${prefijo}_${nit}_${factura}_${tipoId}${numId}.pdf`;
      }
      return `${prefijo}_${nit}_${factura}.pdf`;
    }

    if (options.esCapita) {
      return `${prefijo}_${nit}_FEH${factura}_${tipoId}${numId}.pdf`;
    }
    return `${prefijo}_${nit}_FEH${factura}.pdf`;
  }

  if (eps === 'SALUD_TOTAL') {
    const codigo = (options.codigoSaludTotal || '').trim() ||
                   (tipoDocumento === 'factura' ? 'prefacura' : 'soportes');
    return `${nit}_FEH_${factura}_${codigo}_1.pdf`;
  }

  const id = options.id != null ? String(options.id) : '';
  return `${tipoDocumento}-${id}.pdf`;
}

module.exports = {
  construirContextoRenombramiento,
  resolverFacturaParaDocumento,
  esCapita,
  generarNombreArchivo,
};
