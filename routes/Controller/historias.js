// Archivo: routes/tuRuta.js

const { createToken } = require('./Base/toke');
const { obtenerIds, obtenerIdsPorAdmision } = require('./Base/ids');

/* =========================
 *  Mapeos y constantes
 * ========================= */
const PREFIJOS_NUEVA_EPS = {
  factura: 'FAC',
  anexo: 'ANX',
  historia: 'HAU',
  enfermeria: 'HAM',
  epicrisis: 'EPI',
  evolucion: 'HEV',
  ordenmedica: 'OPF',
  admisiones: 'ADM',
  prefacturas: 'PRE',
  hoja_procedimientos: 'HAP',
  hoja_medicamentos: 'HMD',
  hoja_gastos: 'HGA',
  historia_asistencial: 'HAA',
};

const CODIGOS_SALUD_TOTAL = {
  factura: 'prefacura',
  anexo: 'anexoDos',
  historia: 'historia',
  enfermeria: 'enfermeria',
  epicrisis: 'epicrisis',
  evolucion: 'evolucion',
  ordenmedica: 'ordenMedica',
  admisiones: 'admisiones',
  prefacturas: 'prefacturas',
  hoja_procedimientos: 'hojaProcedimientos',
  hoja_medicamentos: 'hojaMedicamentos',
  hoja_gastos: 'hojaGastos',
  historia_asistencial: 'historiaAsistencial',
};

const FECHA_FIJA_REPORTS = new Set([
  'ListadoAsistencialHojaAdministracionProcedimientos',
  'ListadoAsistencialHojaAdministracionMedicamentos',
  'ListadoAsistencialHojaGastos',
  'ListadoHistoriasAsistencialesDestallado',
]);

// Reporte ↔ param ↔ nombre lógico
const reportMapping = [
  { param: 'idsHistorias',       report: 'ListadoHistoriasClinicasDetallado3',                 nombre: 'historia' },
  { param: 'idAnexosDos',        report: 'ListadoanexoDosDetallado',                           nombre: 'anexo' },
  { param: 'idEgresos',          report: 'ListadoEpicrisis',                                   nombre: 'epicrisis' },
  { param: 'idsEvoluciones',     report: 'ListadoEvolucionDestallado',                         nombre: 'evolucion' },
  { param: 'idsNotasEnfermeria', report: 'ListadoNotasEnfermeriaDestallado',                   nombre: 'enfermeria' },
  { param: 'idsAdmisiones',      report: 'ListadoAdmisionesDetallado',                         nombre: 'admisiones' },
  // OJO: este usa param singular
  { param: 'idAdmisiones',       report: 'ListadoPrefacturasDetallado',                        nombre: 'prefacturas' },
  { param: 'idsOrdenMedicas',    report: 'ListadoOrdenMedicasDestallado',                      nombre: 'ordenmedica' },
  // Nuevos (con fechas fijas)
  { param: 'idsHistorias',       report: 'ListadoAsistencialHojaAdministracionProcedimientos', nombre: 'hoja_procedimientos' },
  { param: 'idsHistorias',       report: 'ListadoAsistencialHojaAdministracionMedicamentos',   nombre: 'hoja_medicamentos' },
  { param: 'idsHistorias',       report: 'ListadoAsistencialHojaGastos',                       nombre: 'hoja_gastos' },
  // Historia asistencial (param singular + auditoria=1)
  { param: 'idHistorias',        report: 'ListadoHistoriasAsistencialesDestallado',            nombre: 'historia_asistencial' },
];

// Códigos → reportes (para filtro `tipos`)
const CODE_TO_REPORTS = {
  HT:   ['ListadoHistoriasClinicasDetallado3'],
  ANX:  ['ListadoanexoDosDetallado'],
  EPI:  ['ListadoEpicrisis'],
  EVL:  ['ListadoEvolucionDestallado'],
  ENF:  ['ListadoNotasEnfermeriaDestallado'],
  ADM:  ['ListadoAdmisionesDetallado'],
  PREF: ['ListadoPrefacturasDetallado'],
  OM:   ['ListadoOrdenMedicasDestallado'],
  HAP:  ['ListadoAsistencialHojaAdministracionProcedimientos'],
  HMD:  ['ListadoAsistencialHojaAdministracionMedicamentos'],
  HGA:  ['ListadoAsistencialHojaGastos'],
  HAA:  ['ListadoHistoriasAsistencialesDestallado'],
  TODO: ['*'],
};

/* =========================
 *  Helpers
 * ========================= */
function getModulo(reportName) {
  const moduloMapping = {
    ListadoHistoriasClinicasDetallado3: 'HistoriasClinicas',
    ListadoanexoDosDetallado: 'Facturacion',
    ListadoEpicrisis: 'Asistencial',
    ListadoEvolucionDestallado: 'Asistencial',
    ListadoNotasEnfermeriaDestallado: 'Asistencial',
    ListadoAdmisionesDetallado: 'Facturacion',
    ListadoPrefacturasDetallado: 'Facturacion',
    ListadoOrdenMedicasDestallado: 'Asistencial',
    ListadoAsistencialHojaAdministracionProcedimientos: 'Asistencial',
    ListadoAsistencialHojaAdministracionMedicamentos: 'Asistencial',
    ListadoAsistencialHojaGastos: 'Asistencial',
    ListadoHistoriasAsistencialesDestallado: 'Asistencial',
  };
  return moduloMapping[reportName] || 'Asistencial';
}

function obtenerNombrePorEPS(eps, nombreBase) {
  const nombresPorEPS = {
    NUEVA_EPS: {
      historia: 'HistoriaNuevaEPS',
      anexo: 'AnexoNuevaEPS',
      epicrisis: 'EpicrisisNuevaEPS',
      evolucion: 'EvolucionNuevaEPS',
      enfermeria: 'EnfermeriaNuevaEPS',
      admisiones: 'AdmisionesNuevaEPS',
      prefacturas: 'PrefacturasNuevaEPS',
      ordenmedica: 'OrdenMedicaNuevaEPS',
      hoja_procedimientos: 'HojaProcedimientosNuevaEPS',
      hoja_medicamentos: 'HojaMedicamentosNuevaEPS',
      hoja_gastos: 'HojaGastosNuevaEPS',
      historia_asistencial: 'HistoriaAsistencialNuevaEPS',
    },
    SALUD_TOTAL: {
      historia: 'HistoriaSaludTotal',
      anexo: 'AnexoSaludTotal',
      epicrisis: 'EpicrisisSaludTotal',
      evolucion: 'EvolucionSaludTotal',
      enfermeria: 'EnfermeriaSaludTotal',
      admisiones: 'AdmisionesSaludTotal',
      prefacturas: 'PrefacturasSaludTotal',
      ordenmedica: 'OrdenMedicaSaludTotal',
      hoja_procedimientos: 'HojaProcedimientosSaludTotal',
      hoja_medicamentos: 'HojaMedicamentosSaludTotal',
      hoja_gastos: 'HojaGastosSaludTotal',
      historia_asistencial: 'HistoriaAsistencialSaludTotal',
    },
  };
  const epsNombres = nombresPorEPS[eps] || {};
  return epsNombres[nombreBase.toLowerCase()] || nombreBase;
}

function formatDateDDMMYYYY(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseTiposParam(raw) {
  if (!raw) return new Set(['*']);
  const parts = String(raw)
    .split(/[,\s|]+/)
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);
  if (parts.includes('TODO')) return new Set(['*']);
  const reports = new Set();
  for (const code of parts) {
    const list = CODE_TO_REPORTS[code];
    if (Array.isArray(list)) list.forEach(r => reports.add(r));
  }
  if (reports.size === 0) reports.add('*');
  return reports;
}

function toArray(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }

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
    nit: String(nit),                 // Usaremos SIEMPRE NIT en los nombres
    tipoId,
    numId,
    factura: String(numeroFactura),
    institucionId: Number(institucionId) || 0, // se mantiene para otros usos si hace falta
    idAdmision: Number(idAdmision) || 0,
  };
}

function resolverFacturaParaDocumento(ids, tipoDocumento, id, facturaFallback) {
  const porDoc = ids?.facturasPorDocumento;
  if (porDoc && porDoc[tipoDocumento] && porDoc[tipoDocumento][id]) {
    return String(porDoc[tipoDocumento][id]);
  }
  return String(facturaFallback || ids?.numeroFactura || '0');
}

// Detector de modalidad (cápita/evento) — respeta el query param si viene
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

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Nombres de archivo: SIEMPRE usando NIT (ctx.nit)
function generarNombreArchivo(eps, tipoDocumento, ctx, options = {}) {
  const { tipoId, numId, nit } = ctx;     // usar NIT
  const factura = options.facturaPorDoc || ctx.factura || '0';

  // NUEVA_EPS
  if (eps === 'NUEVA_EPS') {
    const prefijo = PREFIJOS_NUEVA_EPS[tipoDocumento] || tipoDocumento.toUpperCase();

    if (options.esCapita) {
      // Siempre con tipoId+numId en CÁPITA
      return `${prefijo}_${nit}_FEH${factura}_${tipoId}${numId}.pdf`;
    }
    // En EVENTO: quitar siempre el <tipoId><numId>
    return `${prefijo}_${nit}_FEH${factura}.pdf`;
  }

  // SALUD_TOTAL (no cambia la regla actual)
  if (eps === 'SALUD_TOTAL') {
    const codigo = CODIGOS_SALUD_TOTAL[tipoDocumento] || 'soportes';
    return `${nit}_FEH_${factura}_${codigo}_1.pdf`;
  }

  // Fallback genérico
  const id = options.id != null ? String(options.id) : '';
  return `${tipoDocumento}-${id}.pdf`;
}


/* =========================
 *  Controller principal
 * ========================= */
async function Hs_Anx(req, res) {
  try {
    const {
      clave,
      numeroFactura,
      numeroAdmision,
      idAdmision: idAdmisionRaw,
      institucionId,
      idUser,
      eps,
      // selectores de documentos
      tipos, // preferido
      docs,  // alias
      tipo,  // alias
      modalidad, // permite forzar 'capita' o 'evento'
    } = req.query;

    // Validaciones mínimas
    const missing = [];
    if (!institucionId) missing.push('institucionId');
    if (!idUser) missing.push('idUser');
    if (!eps) missing.push('eps');

    const anyKey = clave ?? numeroFactura ?? numeroAdmision ?? idAdmisionRaw;
    if (!anyKey) missing.push('clave|numeroFactura|numeroAdmision|idAdmision');

    if (missing.length) {
      return res.status(400).send(`❌ Faltan parámetros: ${missing.join(', ')}`);
    }

    // Filtro de tipos -> set de reportes
    const tiposRaw = tipos ?? docs ?? tipo;
    const reportesSeleccionados = parseTiposParam(tiposRaw);

    // === Resolver IDs ===
    const claveFinal = String(anyKey);
    let ids;
    if (idAdmisionRaw && !numeroFactura && !clave && !numeroAdmision) {
      ids = await obtenerIdsPorAdmision({
        institucionId: Number(institucionId),
        idAdmision: Number(idAdmisionRaw),
      });
    } else {
      ids = await obtenerIds({
        institucionId: Number(institucionId),
        clave: claveFinal,
      });
    }

    // Admision resuelta
    const resolvedAdmisionId = (
      Number(ids?.id_admision) ||
      Number(idAdmisionRaw) ||
      Number(numeroAdmision) ||
      (Number.isFinite(Number(claveFinal)) ? Number(claveFinal) : 0)
    );

    // Contexto de renombramiento
    const ctx = construirContextoRenombramiento(ids, {
      idAdmision: resolvedAdmisionId,
      institucionId,
    });

    // === Normalizar colecciones ===
    const normalized = {
      idsHistorias:       toArray(ids.idsHistorias || ids.id_historia),
      idAnexosDos:        toArray(ids.idAnexosDos || ids.anexo2),
      idEgresos:          toArray(ids.idEgresos || ids.id_egreso),
      idsEvoluciones:     toArray(ids.idsEvoluciones || ids.evoluciones),
      idsNotasEnfermeria: toArray(ids.idsNotasEnfermeria || ids.notas_enfermeria),
      idsAdmisiones:      toArray(ids.idsAdmisiones || ids.id_admision || resolvedAdmisionId),
      idAdmisiones:       toArray(resolvedAdmisionId), // para prefacturas (param singular)
      idsOrdenMedicas:    toArray(ids.idsOrdenMedicas || ids.ordenes_medicas),
      idHistorias:        toArray(ids.idHistorias || ids.id_historia), // para historia asistencial
    };

    // === Construir items (sin descargar) ===
    const trabajos = [];
    const FECHA_INICIAL_FIJA = '01/01/2023';
    const FECHA_FINAL_HOY = formatDateDDMMYYYY(new Date());

    // Determinar modalidad (capita/evento)
    const es_capita = esCapita({ modalidad, ids });

    for (const { param, report, nombre } of reportMapping) {
      // aplicar filtro por reporte
      if (!(reportesSeleccionados.has('*') || reportesSeleccionados.has(report))) continue;

      const lista = normalized[param];
      if (!lista || !lista.length) continue;

      const modulo = getModulo(report);
      const nombreEPS = obtenerNombrePorEPS(eps, nombre);

      for (const id of lista) {
        const token = createToken(report, Number(institucionId), 83, Number(idUser));

        const urlParams = new URLSearchParams({
          modulo,
          reporte: report,
          render: 'pdf',
          hideTool: 'true',
          environment: '1',
          userId: String(idUser),
          [param]: String(id),
          token,
        });

        // Fechas fijas para reportes específicos
        if (FECHA_FIJA_REPORTS.has(report)) {
          urlParams.set('fechaInicial', FECHA_INICIAL_FIJA);
          urlParams.set('fechaFinal', FECHA_FINAL_HOY);
        }

        // auditoria=1 solo para historia asistencial
        if (report === 'ListadoHistoriasAsistencialesDestallado') {
          urlParams.set('auditoria', '1');
        }

        const facturaPorDoc = resolverFacturaParaDocumento(ids, nombre, String(id), ctx.factura);
        const nombreArchivoFinal = generarNombreArchivo(
          eps,
          nombre,
          ctx,
          { id, facturaPorDoc, esCapita: es_capita }
        );

        trabajos.push({
          // claves útiles para agrupado:
          numeroAdmision: String(numeroAdmision ?? idAdmisionRaw ?? resolvedAdmisionId),
          numeroFactura: String(numeroFactura ?? ctx.factura ?? '0'),
          // respuesta al cliente:
          nombreArchivo: nombreEPS,
          url: `https://reportes.saludplus.co/view.aspx?${urlParams.toString()}`,
          nombrepdf: nombreArchivoFinal,
        });
      }
    }

    if (!trabajos.length) {
      return res.status(404).json({ success: false, message: 'No se encontraron documentos' });
    }

    // === AGRUPAR por factura o por admisión, con prefijo en la clave ===
    // Regla:
    //  - Si request venía con numeroFactura explícito y no es "0" => agrupa por `factura-<num>`
    //  - Si no, agrupa por `admision-<num>`
    const agruparPorFactura = Boolean(numeroFactura) && String(numeroFactura) !== '0';

    const resultadoFinal = {};
    for (const t of trabajos) {
      const key = agruparPorFactura
        ? `factura-${t.numeroFactura}`
        : `admision-${t.numeroAdmision}`;

      if (!resultadoFinal[key]) {
        resultadoFinal[key] = [];
      }
      resultadoFinal[key].push({
        nombreArchivo: t.nombreArchivo,
        url: t.url,
        nombrepdf: t.nombrepdf,
      });
    }

    // Entrega EXACTAMENTE el objeto agrupado por clave “admision-xxx” o “factura-yyy”
    return res.json(resultadoFinal);

  } catch (error) {
    console.error('🔥 Error en Hs_Anx:', error);
    res.status(500).json({
      error: '❌ Error interno del servidor',
      detalle: error.message,
    });
  }
}

module.exports = { Hs_Anx };
