// constantesReportes.js
const PREFIJOS_NUEVA_EPS = {
  factura: 'FEV',
  detalle_factura: 'DFV',
  nota: 'NDC',
  formato_ami: 'AMI',
  evolucion: 'HEV',
  epicrisis: 'EPI',
  enfermeria: 'HAM',
  resultado_apoyo: 'PDX',
  descripcion_qx: 'DQX',
  registro_anestesia: 'RAN',
  lista_precios: 'LDP',
  acta_juntas: 'JNM',
  consentimiento: 'CNM',
  ordenmedica: 'OPF',
  hoja_urgencias: 'HAU',
  traslado_asistencial: 'TAP',
  transporte_no_asistencial: 'TNA',
  comprobante_recibido: 'CRC',
  factura_soat_adres: 'FAT',
  factura_osteo: 'FMO',
  // legacy si los usas
  admisiones: 'ADM',
  prefacturas: 'PRE',
  hoja_procedimientos: 'HAP',
  hoja_medicamentos: 'HMD',
  hoja_gastos: 'HGA',
  historia_asistencial: 'HAA',
};

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

const reportMapping = [
  { param: 'idsHistorias',       report: 'ListadoHistoriasClinicasDetallado3', nombre: 'historia' },
  { param: 'idAnexosDos',        report: 'ListadoanexoDosDetallado',           nombre: 'anexo' },
  { param: 'idEgresos',          report: 'ListadoEpicrisis',                   nombre: 'epicrisis' },
  { param: 'idsEvoluciones',     report: 'ListadoEvolucionDestallado',         nombre: 'evolucion' },
  { param: 'idsNotasEnfermeria', report: 'ListadoNotasEnfermeriaDestallado',   nombre: 'enfermeria' },
  { param: 'idsAdmisiones',      report: 'ListadoAdmisionesDetallado',         nombre: 'admisiones' },
  { param: 'idAdmisiones',       report: 'ListadoPrefacturasDetallado',        nombre: 'prefacturas' },
  { param: 'idsOrdenMedicas',    report: 'ListadoOrdenMedicasDestallado',      nombre: 'ordenmedica' },
  // agrega los nuevos cuando tengas los reportes
];

module.exports = { PREFIJOS_NUEVA_EPS, CODE_TO_REPORTS, reportMapping };
